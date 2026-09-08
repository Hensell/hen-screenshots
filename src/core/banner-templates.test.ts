import { duplicateUnit, shotCapacity } from "./panorama";
import { describe, expect, it } from "vitest";
import { bannerTemplates } from "./banner-templates";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
} from "./model";
import {
  applyTemplate,
  changeExportProfile,
  resetComposition,
  templateLayout,
  templatePreview,
} from "./templates";
import {
  canonicalCanvas,
  getExportProfile,
  validateDimensions,
} from "./export-profiles";
import { projectPurpose, profileForOrientation } from "./canvas-formats";
import {
  bannerCatalogIndex,
  templateCatalogIndex,
  defaultCatalogFilters,
  queryCatalog,
} from "./template-catalog";
import { deviceGeometry, fitImage } from "../rendering/geometry";
import { resizeDevice } from "./device-placement";
import { addLanguage, localizedProject } from "./localization";
import { setDeviceImage } from "./device-composition";
import { moveText } from "./text-placement";
import { messageCatalog } from "../i18n/core";

function fixture() {
  const p = createProject("My app banners");
  p.exportProfile = "play-feature-graphic";
  p.shots = [createShot("icon", 0)];
  applyTemplate(p, p.shots[0].id, "banner-signal");
  return p;
}
describe("Google Play banner workspace", () => {
  it("keeps up to 20 banner alternatives without changing the one-banner export limit", () => {
    const p = fixture();
    expect(shotCapacity(p)).toBe(20);
    for (let i = 1; i < 20; i++)
      expect(duplicateUnit(p, p.shots[0].id)).toBeTruthy();
    expect(duplicateUnit(p, p.shots[0].id)).toBeUndefined();
    expect(p.shots).toHaveLength(20);
    expect(getExportProfile(p.exportProfile).maxCount).toBe(1);
  });
  it.each([
    ["play-feature-graphic", 1024, 500],
    ["play-tv-banner", 1280, 720],
  ] as const)(
    "enforces the exact %s dimensions without screenshot-only restrictions",
    (id, width, height) => {
      const profile = getExportProfile(id);
      expect(projectPurpose({ exportProfile: id })).toBe("banners");
      expect(profileForOrientation(id, "portrait")).toBeUndefined();
      expect(() => validateDimensions(profile, width, height)).not.toThrow();
      expect(() => validateDimensions(profile, height, width)).toThrow();
      expect(() =>
        validateDimensions({ ...profile, width: width + 1 }, width + 1, height),
      ).toThrow();
      expect(() =>
        validateDimensions(
          { ...profile, store: "presentation" },
          width,
          height,
        ),
      ).toThrow();
    },
  );
  it("keeps banner discovery and favorites separate from screenshot templates", () => {
    expect(bannerCatalogIndex).toHaveLength(6);
    expect(
      templateCatalogIndex.some(({ item }) => item.id.startsWith("banner-")),
    ).toBe(false);
    expect(
      queryCatalog(bannerCatalogIndex, {
        ...defaultCatalogFilters,
        appearance: "dark",
      }).items.map((i) => i.id),
    ).toEqual(["banner-orbit", "banner-dusk"]);
    expect(
      queryCatalog(
        bannerCatalogIndex,
        { ...defaultCatalogFilters, favoritesOnly: true },
        new Set(["banner-signal", "studio"]),
      ).items.map((i) => i.id),
    ).toEqual(["banner-signal"]);
  });
  it.each(bannerTemplates)(
    "fits $name artwork without overlapping captions in either size",
    (template) => {
      for (const id of ["play-feature-graphic", "play-tv-banner"] as const) {
        const p = fixture(),
          s = p.shots[0];
        changeExportProfile(p, id);
        const original = structuredClone(p);
        const preview = templatePreview(p, s, template.id, false);
        expect(p).toEqual(original);
        applyTemplate(p, s.id, template.id);
        expect(s.phone).toEqual(preview.phone);
        const style = resolveStyle(p, s),
          layout = templateLayout(p, style);
        const geometry = deviceGeometry(
          style.device,
          s.phone.width,
          style.frame,
          style.deviceOrientation,
        );
        expect(s.phone.x).toBeGreaterThan(0);
        expect(s.phone.y).toBeGreaterThan(0);
        expect(s.phone.x + geometry.width).toBeLessThan(1080);
        expect(s.phone.y + geometry.height).toBeLessThan(
          canonicalCanvas(p).height,
        );
        for (const box of [layout.title, layout.subtitle])
          expect(
            s.phone.x + geometry.width <= box.x ||
              s.phone.x >= box.x + box.width,
          ).toBe(true);
        expect(() =>
          validateProject(JSON.parse(JSON.stringify(p))),
        ).not.toThrow();
      }
      for (const key of [
        template.description,
        template.note,
        template.surfaceLabel!,
      ])
        expect(messageCatalog[key]).toHaveLength(2);
    },
  );
  it("preserves image shape despite device settings inherited from a brand", () => {
    const p = fixture(),
      s = p.shots[0];
    Object.assign(s.style, {
      device: "ios",
      frame: true,
      camera: true,
      fit: "cover",
      deviceOrientation: "portrait",
    });
    const style = resolveStyle(p, s);
    expect(style).toMatchObject({
      device: "card",
      frame: false,
      camera: false,
      fit: "contain",
      deviceOrientation: "landscape",
    });
    const area = deviceGeometry(
      style.device,
      300,
      style.frame,
      style.deviceOrientation,
    ).screen;
    for (const [width, height] of [
      [512, 512],
      [1200, 400],
      [300, 800],
    ]) {
      const image = fitImage(width, height, area, style.fit);
      expect(image.width / image.height).toBeCloseTo(width / height);
      expect(image.width).toBeLessThanOrEqual(area.width);
      expect(image.height).toBeLessThanOrEqual(area.height);
    }
  });
  it("links layout across languages while replacing only the chosen image", () => {
    const p = fixture(),
      s = p.shots[0];
    addLanguage(p, "en", "es");
    moveText(s, "title", 15, -10);
    const original = structuredClone(s);
    setDeviceImage(s, "device", "spanish-icon", "es");
    const version = localizedProject(p, "es");
    expect(version.shots[0].assetId).toBe("spanish-icon");
    expect(s.assetId).toBe("icon");
    expect(s.phone).toEqual(original.phone);
    expect(s.textOffsets).toEqual(original.textOffsets);
    expect(s.title).toBe(original.title);
    resizeDevice(s, resolveStyle(p, s), s.phone.width * 1.3);
    expect(localizedProject(p, "es").shots[0].phone).toEqual(s.phone);
    resetComposition(p, s);
    expect(s.phone).toEqual(original.phone);
    expect(() => validateProject(p)).not.toThrow();
  });
});
