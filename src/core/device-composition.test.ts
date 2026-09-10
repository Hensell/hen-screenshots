import { SCHEMA_VERSION } from "./model";
import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  migrateProject,
  resolveStyle,
  validateProject,
  type V7Project,
} from "./model";
import {
  deviceCompositions,
  deviceShot,
  editDevice,
  setDeviceImage,
} from "./device-composition";
import {
  applyTemplate,
  changeCustomSize,
  changeExportProfile,
  resetComposition,
  templateLayout,
  templatePreview,
} from "./templates";
import {
  addLanguage,
  localContent,
  localizedProject,
  referencedAssetIds,
} from "./localization";
import { exportProfiles, canonicalCanvas } from "./export-profiles";
import { deviceGeometry } from "../rendering/geometry";
import { duplicateUnit } from "./panorama";

const fixture = () => {
  const project = createProject("Connected app");
  project.shots = [createShot("mobile", 0)];
  return project;
};
describe("multi-device compositions", () => {
  it.each(Object.entries(deviceCompositions))(
    "fits all devices in %s across every export profile",
    (id, families) => {
      for (const profile of exportProfiles.filter(
        (item) => item.category !== "banner",
      )) {
        const p = fixture();
        p.exportProfile = profile.id;
        p.customSize = { width: 2560, height: 640 };
        const s = p.shots[0];
        applyTemplate(p, s.id, id as keyof typeof deviceCompositions);
        const devices = [
          deviceShot(s, "device"),
          ...(s.companions ?? []).map((d) => deviceShot(s, `device:${d.id}`)),
        ];
        expect(devices.map((d) => resolveStyle(p, d).device)).toEqual(families);
        const captions = templateLayout(p, resolveStyle(p, s));
        for (const slot of devices) {
          const style = resolveStyle(p, slot);
          const geom = deviceGeometry(
            style.device,
            slot.phone.width,
            style.frame,
            style.deviceOrientation,
          );
          const angle = (Math.abs(slot.phone.rotation) * Math.PI) / 180;
          const w =
            Math.cos(angle) * geom.width + Math.sin(angle) * geom.height;
          const h =
            Math.cos(angle) * geom.height + Math.sin(angle) * geom.width;
          const x = slot.phone.x + (geom.width - w) / 2,
            y = slot.phone.y + (geom.height - h) / 2;
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x + w).toBeLessThanOrEqual(1080);
          expect(y + h).toBeLessThanOrEqual(canonicalCanvas(p).height);
          for (const box of [captions.title, captions.subtitle])
            expect(
              x < box.x + box.width &&
                x + w > box.x &&
                y < box.y + box.height &&
                y + h > box.y,
            ).toBe(false);
        }
        expect(() => validateProject(p)).not.toThrow();
      }
    },
  );
  it("replaces and moves just one device, with independent language images and shared geometry", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "ecosystem");
    addLanguage(p, "en", "es");
    const before = structuredClone(s);
    setDeviceImage(s, "device:secondary", "tablet", null);
    setDeviceImage(s, "device:tertiary", "phone-es", "es");
    editDevice(s, "device:secondary", (slot) => {
      slot.phone = { ...slot.phone, x: 73 };
      slot.style.camera = false;
    });
    expect(s.phone).toEqual(before.phone);
    expect(s.assetId).toBe("mobile");
    expect(s.companions![1]).toEqual(before.companions![1]);
    const view = localizedProject(p, "es").shots[0];
    expect(view.companions!.map((d) => d.assetId)).toEqual([
      "tablet",
      "phone-es",
    ]);
    expect(view.companions![0].phone.x).toBe(73);
    expect(new Set(referencedAssetIds(p))).toEqual(
      new Set(["mobile", "tablet", "phone-es"]),
    );
    validateProject(p);
  });
  it("preserves platform images and localized overrides when switching combinations", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "ecosystem");
    addLanguage(p, "en", "es");
    setDeviceImage(s, "device", "desktop", null);
    setDeviceImage(s, "device:secondary", "tablet", null);
    setDeviceImage(s, "device:tertiary", "phone", null);
    setDeviceImage(s, "device:secondary", "tablet-es", "es");
    setDeviceImage(s, "device:tertiary", "phone-es", "es");
    const before = structuredClone(p),
      preview = templatePreview(p, s, "companion", false);
    expect(p).toEqual(before);
    applyTemplate(p, s.id, "companion");
    expect(s.assetId).toBe("tablet");
    expect(s.companions![0].assetId).toBe("phone");
    expect(s.phone).toEqual(preview.phone);
    expect(s.companions).toEqual(preview.companions);
    expect(localContent(s, "es").assetId).toBe("tablet-es");
    expect(localContent(s, "es").deviceAssets).toEqual({
      secondary: "phone-es",
    });
    applyTemplate(p, s.id, "studio");
    expect(s.companions).toBeUndefined();
    expect(localContent(s, "es").deviceAssets).toBeUndefined();
    validateProject(p);
  });
  it("does not replace a phone capture with a frameless card when matching platforms", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "ecosystem");
    s.style.device = "card";
    setDeviceImage(s, "device", "desktop-card", null);
    setDeviceImage(s, "device:tertiary", "real-phone", null);
    applyTemplate(p, s.id, "constellation");
    expect(s.companions![1].assetId).toBe("real-phone");
    expect(s.assetId).toBe("desktop-card");
  });
  it("duplicates and reflows a full composition without sharing mutable placements or losing images", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "ecosystem");
    setDeviceImage(s, "device:tertiary", "phone", null);
    duplicateUnit(p, s.id);
    expect(p.shots).toHaveLength(2);
    editDevice(p.shots[1], "device:tertiary", (slot) => {
      slot.phone.x = 99;
    });
    expect(s.companions![1].phone.x).not.toBe(99);
    changeExportProfile(p, "portfolio-custom");
    changeCustomSize(p, { width: 1600, height: 1000 });
    expect(s.companions![1].assetId).toBe("phone");
    validateProject(p);
    applyTemplate(p, s.id, "panorama");
    expect(p.shots[0].companions).toBeUndefined();
    expect(p.shots[1].companions).toBeUndefined();
    validateProject(p);
  });
  it("initializes devices for new slides when the project uses a multi-device template", () => {
    const p = fixture();
    applyTemplate(p, p.shots[0].id, "ecosystem", true);
    const shot = createShot("new", 1);
    resetComposition(p, shot);
    p.shots.push(shot);
    expect(shot.companions).toHaveLength(2);
    validateProject(p);
  });
  it("migrates version 7 without altering existing content", () => {
    const old: V7Project = { ...fixture(), schemaVersion: 7 };
    const before = structuredClone(old);
    const upgraded = migrateProject(old);
    expect(upgraded).toEqual({ ...before, schemaVersion: SCHEMA_VERSION });
    expect(old).toEqual(before);
    validateProject(upgraded);
  });
  it("resets changed frame families within the supported bounds on very wide canvases", () => {
    for (const id of Object.keys(deviceCompositions))
      for (const family of [
        "ios",
        "android",
        "ipad",
        "android-tablet",
        "monitor",
        "laptop",
        "card",
      ] as const) {
        const p = fixture();
        p.exportProfile = "portfolio-custom";
        p.customSize = { width: 2560, height: 640 };
        const s = p.shots[0];
        applyTemplate(p, s.id, id as keyof typeof deviceCompositions);
        s.style.device = family;
        s.style.deviceOrientation = "portrait";
        resetComposition(p, s);
        expect(() => validateProject(p)).not.toThrow();
      }
  });
  it("rejects missing devices or companions on a single-device template", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "ecosystem");
    s.companions!.pop();
    expect(() => validateProject(p)).toThrow();
    s.style.template = "studio";
    expect(() => validateProject(p)).toThrow();
  });
  it("rejects malformed slots and dangling translated device references", () => {
    const p = fixture(),
      s = p.shots[0];
    applyTemplate(p, s.id, "sidekick");
    for (const patch of [
      { id: "tertiary" },
      { assetId: "" },
      { phone: { ...s.phone, width: NaN } },
      { style: { ...s.companions![0].style, titleSize: 100 } },
    ]) {
      const bad = structuredClone(p);
      Object.assign(bad.shots[0].companions![0], patch);
      expect(() => validateProject(bad)).toThrow();
    }
    addLanguage(p, "en", "es");
    localContent(s, "es").deviceAssets = { tertiary: "missing-slot" };
    expect(() => validateProject(p)).toThrow();
  });
});
