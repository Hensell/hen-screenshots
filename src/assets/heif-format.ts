export const IMAGE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif";

const text = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

/** File signatures, never MIME types or extensions supplied by a file picker. */
export function isHeif(bytes: Uint8Array): boolean {
  if (bytes.length < 16 || text(bytes, 4, 8) !== "ftyp") return false;
  const size = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(0);
  const brands: string[] = [text(bytes, 8, 12)];
  for (let at = 16; at + 4 <= Math.min(size, bytes.length); at += 4)
    brands.push(text(bytes, at, at + 4));
  return (
    !brands.some((brand) => ["avif", "avis"].includes(brand)) &&
    brands.some((brand) =>
      ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand),
    )
  );
}

interface Box {
  type: string;
  start: number;
  end: number;
}
function boxes(bytes: Uint8Array, start: number, end: number): Box[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result: Box[] = [];
  for (let at = start; at < end;) {
    if (result.length >= 4096) throw new Error("Invalid HEIF metadata");
    if (at + 8 > end) throw new Error("Invalid HEIF metadata");
    let size = view.getUint32(at),
      header = 8;
    if (size === 1) {
      if (at + 16 > end) throw new Error("Invalid HEIF metadata");
      size = Number(view.getBigUint64(at + 8));
      header = 16;
    } else if (size === 0) size = end - at;
    if (!Number.isSafeInteger(size) || size < header || at + size > end)
      throw new Error("Invalid HEIF metadata");
    result.push({
      type: text(bytes, at + 4, at + 8),
      start: at + header,
      end: at + size,
    });
    at += size;
  }
  return result;
}

/** Only the primary item's color profile: auxiliary HDR gain maps have their own. */
export function primaryHeifProfile(bytes: Uint8Array): Uint8Array | undefined {
  const meta = boxes(bytes, 0, bytes.length).find((box) => box.type === "meta");
  if (!meta) return;
  const children = boxes(bytes, meta.start + 4, meta.end);
  const pitm = children.find((box) => box.type === "pitm");
  const iprp = children.find((box) => box.type === "iprp");
  if (!pitm || !iprp) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const primary =
    bytes[pitm.start] === 0
      ? view.getUint16(pitm.start + 4)
      : view.getUint32(pitm.start + 4);
  const properties = boxes(bytes, iprp.start, iprp.end);
  const ipco = properties.find((box) => box.type === "ipco");
  if (!ipco) return;
  const entries = boxes(bytes, ipco.start, ipco.end);
  const associated: Box[] = [];
  for (const ipma of properties.filter((box) => box.type === "ipma")) {
    const version = bytes[ipma.start],
      wide = bytes[ipma.start + 3] & 1;
    let at = ipma.start + 8;
    const count = view.getUint32(ipma.start + 4);
    for (let n = 0; n < count; n++) {
      const idBytes = version < 1 ? 2 : 4;
      if (at + idBytes + 1 > ipma.end) throw new Error("Invalid HEIF metadata");
      const id = idBytes === 2 ? view.getUint16(at) : view.getUint32(at);
      at += idBytes;
      const associations = bytes[at++];
      for (let p = 0; p < associations; p++) {
        if (at + (wide ? 2 : 1) > ipma.end)
          throw new Error("Invalid HEIF metadata");
        const index = wide ? view.getUint16(at) & 0x7fff : bytes[at] & 0x7f;
        at += wide ? 2 : 1;
        if (id === primary && index && entries[index - 1])
          associated.push(entries[index - 1]);
      }
    }
  }
  const colors = associated.filter((box) => box.type === "colr");
  const icc = colors.find((box) =>
    ["prof", "rICC"].includes(text(bytes, box.start, box.start + 4)),
  );
  if (icc) {
    const profile = bytes.slice(icc.start + 4, icc.end);
    if (
      profile.length < 128 ||
      profile.length > 1024 * 1024 ||
      text(profile, 36, 40) !== "acsp"
    )
      throw new Error("Invalid HEIF color profile");
    return profile;
  }
  for (const box of colors) {
    if (text(bytes, box.start, box.start + 4) !== "nclx") continue;
    if (box.end - box.start < 11) throw new Error("Invalid HEIF color profile");
    const primaries = view.getUint16(box.start + 4),
      transfer = view.getUint16(box.start + 6);
    if ([9, 12].includes(primaries) || [16, 18].includes(transfer))
      throw new Error(
        "This HEIC uses an HDR or wide-color profile that cannot be converted here. On your iPhone, choose Settings → General → Screen Capture → SDR, then take a new screenshot. You can also export an SDR PNG or JPEG from Photos.",
      );
  }
}
