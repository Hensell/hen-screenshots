import { describe, expect, it } from "vitest";
import { unzlibSync } from "fflate";
import { isHeif, primaryHeifProfile } from "./heif-format";
import { withPngProfile } from "./png-profile";
const ascii = (s: string) => new TextEncoder().encode(s);
const join = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};
const u32 = (n: number) => {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n);
  return out;
};
const box = (name: string, ...parts: Uint8Array[]) => {
  const data = join(...parts);
  return join(u32(data.length + 8), ascii(name), data);
};
function profile(marker: number) {
  const out = new Uint8Array(128);
  out.set(u32(128));
  out.set(ascii("acsp"), 36);
  out[80] = marker;
  return out;
}
function heif(color: Uint8Array, wide = false) {
  return box(
    "meta",
    u32(0),
    box(
      "pitm",
      u32(wide ? 1 << 24 : 0),
      wide ? u32(31) : new Uint8Array([0, 31]),
    ),
    box(
      "iprp",
      box("ipco", box("colr", ascii("prof"), profile(1)), color),
      box(
        "ipma",
        u32(wide ? (1 << 24) | 1 : 0),
        u32(2),
        wide
          ? join(
              u32(30),
              new Uint8Array([1, 0x80, 1]),
              u32(31),
              new Uint8Array([1, 0x80, 2]),
            )
          : new Uint8Array([0, 30, 1, 0x81, 0, 31, 1, 0x82]),
      ),
    ),
  );
}
describe("HEIF signatures and primary color metadata", () => {
  it("uses real compatible brands and does not misclassify AVIF", () => {
    expect(isHeif(box("ftyp", ascii("mif1"), u32(0), ascii("heic")))).toBe(
      true,
    );
    expect(isHeif(box("ftyp", ascii("mif1"), u32(0), ascii("avif")))).toBe(
      false,
    );
    expect(isHeif(ascii("photo.heic"))).toBe(false);
  });
  it.each([false, true])(
    "uses the primary ICC instead of the auxiliary HDR profile (wide IDs: %s)",
    (wide) => {
      expect(
        primaryHeifProfile(heif(box("colr", ascii("prof"), profile(2)), wide)),
      ).toEqual(profile(2));
    },
  );
  it("rejects unsupported direct HDR and malformed profiles with recovery guidance", () => {
    const nclx = box(
      "colr",
      ascii("nclx"),
      new Uint8Array([0, 9, 0, 16, 0, 9, 128]),
    );
    expect(() => primaryHeifProfile(heif(nclx))).toThrow("SDR");
    expect(() =>
      primaryHeifProfile(heif(box("colr", ascii("prof"), new Uint8Array(12)))),
    ).toThrow("color profile");
    expect(() =>
      primaryHeifProfile(new Uint8Array([0, 0, 0, 50, 109, 101, 116, 97])),
    ).toThrow("metadata");
  });
  it("retains ICC data in PNG output and removes contradictory sRGB metadata", async () => {
    const png = new Blob(
      [
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
        box("IHDR", new Uint8Array(13), u32(0)),
        box("sRGB", new Uint8Array([0]), u32(0)),
        box("IEND", u32(0)),
      ],
      { type: "image/png" },
    );
    // PNG length excludes CRC, unlike ISO boxes.
    const raw = new Uint8Array(await png.arrayBuffer());
    for (let at = 8; at < raw.length;) {
      const n = new DataView(raw.buffer).getUint32(at);
      new DataView(raw.buffer).setUint32(at, n - 12);
      at += n;
    }
    const output = new Uint8Array(
      await (await withPngProfile(new Blob([raw]), profile(2))).arrayBuffer(),
    );
    const chunks: string[] = [];
    for (let at = 8; at < output.length;) {
      const n = new DataView(output.buffer).getUint32(at);
      const type = new TextDecoder().decode(output.slice(at + 4, at + 8));
      chunks.push(type);
      if (type === "iCCP")
        expect(unzlibSync(output.slice(at + 14, at + 8 + n))).toEqual(
          profile(2),
        );
      at += n + 12;
    }
    expect(chunks).toEqual(["IHDR", "iCCP", "IEND"]);
  });
});
