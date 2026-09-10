import { describe, expect, it } from "vitest";
import { buildDesign, parseDesignSpec, specImagePaths } from "./spec";
import { resolveStyle, type Asset } from "../core/model";
import { appliedBrand } from "../core/brand-application";
import { newBrandKit } from "../core/brand-kit";
import { resolveExportProfile } from "../core/export-profiles";

const assets = new Map(
  ["home.png", "tablet.png", "desktop.png"].map((name) => [
    name,
    {
      id: crypto.randomUUID(),
      name,
      width: 320,
      height: 640,
      mime: "image/png",
      blob: new Blob(),
    } as Asset,
  ]),
);
const base = {
  version: 1,
  name: "Example",
  profile: "play-phone-portrait",
  slides: [{ image: "home.png", title: "A useful feature." }],
};
const build = (overrides = {}) =>
  buildDesign(parseDesignSpec({ ...base, ...overrides }), assets);

describe("agent design contract", () => {
  it("creates editable slides with template geometry and profile-aware frames", () => {
    const phone = build();
    expect(phone.shots[0].assetId).toBe(assets.get("home.png")!.id);
    expect(phone.shots[0].title).toBe("A useful feature.");
    expect(resolveStyle(phone, phone.shots[0]).template).toBe("studio");
    const tablet = build({ profile: "apple-ipad13-portrait" });
    expect(resolveStyle(tablet, tablet.shots[0]).device).toBe("ipad");
  });
  it.each([
    { typo: true },
    { template: 12 },
    { template: "banner-invented" },
    { device: "banana" },
    { profile: "unknown" },
    { sourceLanguage: "xx" },
    { customSize: { width: 800, height: 600 } },
    { slides: [{ image: "home.png", title: "Test", placement: { scale: 2 } }] },
    { slides: [{ image: "home.png", title: "Test", style: { rotation: 10 } }] },
  ])("rejects invalid or silently ignored options: %j", (overrides) => {
    expect(() => build(overrides)).toThrow();
  });
  it("resolves custom dimensions and validates placement values", () => {
    const p = build({
      profile: "portfolio-custom",
      customSize: { width: 800, height: 600 },
    });
    expect(resolveExportProfile(p)).toMatchObject({ width: 800, height: 600 });
    expect(() =>
      build({
        slides: [
          {
            ...base.slides[0],
            placement: { x: 0, y: 0, width: -2, rotation: 0 },
          },
        ],
      }),
    ).toThrow();
  });
  it("creates a linked panorama with independent translated captions", () => {
    const project = build({
      template: "panorama",
      slides: [
        {
          image: "home.png",
          title: "Left",
          translations: { es: { title: "Izquierda" } },
          continuation: {
            title: "Right",
            translations: { es: { title: "Derecha" } },
          },
        },
      ],
    });
    expect(project.shots).toHaveLength(2);
    expect(project.shots[0].assetId).toBe(project.shots[1].assetId);
    expect(project.shots[0].phone).toEqual(project.shots[1].phone);
    expect(project.shots[1].style.template).toBe("panorama-end");
    expect(project.shots.map((shot) => shot.translations!.es.title)).toEqual([
      "Izquierda",
      "Derecha",
    ]);
    expect(project.shots[1].translations!.es.status).toBe("draft");
    expect(() => build({ template: "panorama" })).toThrow(/continuation/);
  });
  it("assigns distinct images to a three-device composition", () => {
    const slides = [
      {
        ...base.slides[0],
        image: "desktop.png",
        template: "ecosystem",
        companions: ["tablet.png", "home.png"],
      },
    ];
    const spec = parseDesignSpec({ ...base, slides });
    const project = buildDesign(spec, assets);
    expect(specImagePaths(spec)).toEqual([
      "desktop.png",
      "tablet.png",
      "home.png",
    ]);
    expect(project.shots[0].companions?.map((d) => d.assetId)).toEqual([
      assets.get("tablet.png")!.id,
      assets.get("home.png")!.id,
    ]);
    expect(() => build({ template: "ecosystem" })).toThrow(/companion/);
  });
  it("rejects incomplete translations, missing assets and incompatible store slots", () => {
    expect(() =>
      build({
        slides: [
          { ...base.slides[0], translations: { es: { title: "Hola" } } },
          base.slides[0],
        ],
      }),
    ).toThrow(/every slide/);
    expect(() =>
      build({ slides: [{ image: "missing.png", title: "Missing" }] }),
    ).toThrow(/Missing image/);
    expect(() => build({ template: "banner-signal" })).toThrow(
      /Banner profiles/,
    );
    expect(() =>
      build({
        profile: "play-feature-graphic",
        slides: [base.slides[0], base.slides[0]],
      }),
    ).toThrow(/1 slides/);
  });
  it("applies a portable brand kit to the series", () => {
    const brand = newBrandKit("Example brand");
    const p = buildDesign(parseDesignSpec(base), assets, brand);
    expect(appliedBrand(p)?.name).toBe("Example brand");
    expect(resolveStyle(p, p.shots[0]).background).toBe(
      brand.colors.background,
    );
  });
});
