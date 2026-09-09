import { zlibSync } from "fflate";

function chunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(data.length + 12),
    view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  let crc = 0xffffffff;
  for (const byte of out.subarray(4, out.length - 4)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  view.setUint32(out.length - 4, (crc ^ 0xffffffff) >>> 0);
  return out;
}

/** Canvas encodes the decoder's RGB bytes; retain their ICC profile for browser color management. */
export async function withPngProfile(
  png: Blob,
  profile: Uint8Array,
): Promise<Blob> {
  const bytes = new Uint8Array(await png.arrayBuffer());
  const compressed = zlibSync(profile),
    data = new Uint8Array(compressed.length + 6);
  data.set([72, 69, 73, 70, 0, 0]);
  data.set(compressed, 6);
  const parts: BlobPart[] = [bytes.slice(0, 8)];
  for (let at = 8; at + 12 <= bytes.length;) {
    const size = new DataView(bytes.buffer).getUint32(at);
    if (at + size + 12 > bytes.length) throw new Error("Invalid PNG output");
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    if (!["iCCP", "sRGB", "gAMA", "cHRM", "cICP"].includes(type))
      parts.push(bytes.slice(at, at + size + 12));
    if (type === "IHDR") parts.push(chunk("iCCP", data));
    at += size + 12;
  }
  return new Blob(parts, { type: "image/png" });
}
