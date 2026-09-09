import { describe, expect, it } from "vitest";
import {
  checkConversionSize,
  extraImageFormat,
  validateAvif,
} from "./extra-formats";
const ascii = (s: string) => new TextEncoder().encode(s);
function box(type: string, ...parts: Uint8Array[]) {
  const out = new Uint8Array(8 + parts.reduce((sum, b) => sum + b.length, 0));
  new DataView(out.buffer).setUint32(0, out.length);
  out.set(ascii(type), 4);
  let at = 8;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
function fixture(width = 1320, height = 2868) {
  const size = new Uint8Array(12),
    view = new DataView(size.buffer);
  view.setUint32(4, width);
  view.setUint32(8, height);
  return new Uint8Array([
    ...box("ftyp", ascii("avif"), new Uint8Array(4), ascii("mif1")),
    ...box(
      "meta",
      new Uint8Array(4),
      box("iprp", box("ipco", box("ispe", size))),
    ),
  ]);
}
describe("additional source formats", () => {
  it("recognizes AVIF independently of filename, MIME, or HEIF compatibility", () => {
    expect(extraImageFormat(fixture())).toBe("avif");
    expect(
      extraImageFormat(
        box("ftyp", ascii("mif1"), new Uint8Array(4), ascii("avif")),
      ),
    ).toBe("avif");
    expect(
      extraImageFormat(
        box("ftyp", ascii("avif"), new Uint8Array(4), ascii("avis")),
      ),
    ).toBe("animated-avif");
  });
  it.each([
    ["%PDF-1.7", "pdf"],
    ["BMdata", "bmp"],
    ["8BPSdata", "psd"],
    [
      '<?xml version="1.0"?>\n<!-- logo --><svg xmlns="http://www.w3.org/2000/svg">',
      "svg",
    ],
  ])("recognizes %s and offers the right conversion route", (content, format) =>
    expect(extraImageFormat(ascii(content))).toBe(format),
  );
  it("bounds AVIF pixels before decoding and rejects malformed or animated containers", () => {
    expect(() => validateAvif(fixture())).not.toThrow();
    expect(() => validateAvif(fixture(32768, 32768))).toThrow(/24 megapixels/);
    expect(() => validateAvif(fixture(0, 20))).toThrow(/24 megapixels/);
    expect(() => validateAvif(fixture().slice(0, -1))).toThrow(/metadata/);
    expect(() => validateAvif(box("ftyp", ascii("avif")))).toThrow(/metadata/);
    expect(() =>
      validateAvif(new Uint8Array([...fixture(), ...box("moov")])),
    ).toThrow(/Animated/);
    for (const value of [NaN, Infinity, -1])
      expect(() => checkConversionSize(value, 50)).toThrow();
  });
});
