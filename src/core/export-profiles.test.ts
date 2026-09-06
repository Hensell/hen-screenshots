import { describe, expect, it } from "vitest";
import {
  canonicalCanvas,
  exportProfiles,
  getExportProfile,
  validateDimensions,
  validateExportPng,
} from "./export-profiles";
import {
  createProject,
  createShot,
  PLACEMENT_LIMITS,
  resolveStyle,
  validateProject,
  type DeviceFamily,
} from "./model";
import {
  changeExportProfile,
  resetComposition,
  templateLayout,
  templatePreview,
  templates,
} from "./templates";
import { deviceGeometry } from "../rendering/geometry";

function pngHeader(width: number, height: number, color = 2, depth = 8) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const header = new DataView(bytes.buffer);
  header.setUint32(16, width);
  header.setUint32(20, height);
  bytes[24] = depth;
  bytes[25] = color;
  return new Blob([bytes], { type: "image/png" });
}

describe("store export profiles", () => {
  it("uses only exact accepted Apple slots and Google bounds", () => {
    expect(new Set(exportProfiles.map((p) => p.id)).size).toBe(
      exportProfiles.length,
    );
    for (const profile of exportProfiles) {
      expect(() =>
        validateDimensions(profile, profile.width, profile.height),
      ).not.toThrow();
      expect(() => validateDimensions(profile, 1080, 2340)).toThrow();
      expect(() =>
        validateDimensions(profile, profile.width * 2, profile.height * 2),
      ).toThrow();
      if (profile.store === "apple") expect(profile.maxCount).toBe(10);
      if (profile.store === "google") expect(profile.maxCount).toBe(8);
    }
    expect(() =>
      validateDimensions(
        { ...getExportProfile("apple-mac"), width: 1920, height: 1080 },
        1920,
        1080,
      ),
    ).toThrow(/not accepted/);
    expect(() =>
      validateDimensions(
        {
          ...getExportProfile("play-phone-portrait"),
          width: 1080,
          height: 2400,
        },
        1080,
        2400,
      ),
    ).toThrow(/Google Play/);
    expect(() =>
      validateDimensions(
        {
          ...getExportProfile("play-tablet10-portrait"),
          width: 1536,
          height: 2048,
        },
        1536,
        2048,
      ),
    ).toThrow(/16:9/);
  });
  it("checks the actual PNG dimensions, RGB color type and bit depth", async () => {
    for (const profile of exportProfiles) {
      await expect(
        validateExportPng(pngHeader(profile.width, profile.height), profile),
      ).resolves.toBeUndefined();
      await expect(
        validateExportPng(pngHeader(profile.width, profile.height, 6), profile),
      ).rejects.toThrow(/transparency/);
      await expect(
        validateExportPng(
          pngHeader(profile.width, profile.height, 2, 16),
          profile,
        ),
      ).rejects.toThrow(/24-bit/);
      await expect(
        validateExportPng(pngHeader(320, 640), profile),
      ).rejects.toThrow(/dimensions/);
    }
    await expect(
      validateExportPng(
        new Blob(["not a PNG"], { type: "image/png" }),
        exportProfiles[0],
      ),
    ).rejects.toThrow(/valid PNG/);
  });
});

describe("adaptive compositions", () => {
  it("fits rotated devices in the canvas for every new device, template, orientation and export size", () => {
    for (const device of [
      "android",
      "ios",
      "ipad",
      "android-tablet",
      "monitor",
      "laptop",
    ] as DeviceFamily[])
      for (const orientation of ["portrait", "landscape"] as const)
        for (const frame of [true, false])
          for (const profile of exportProfiles)
            for (const template of templates) {
              const project = createProject();
              project.exportProfile = profile.id;
              Object.assign(project.style, {
                device,
                deviceOrientation: orientation,
                frame,
                template: template.id,
              });
              const shot = createShot("source", 0);
              project.shots.push(shot);
              resetComposition(project, shot);
              expect(
                () => validateProject(project),
                `${device}/${orientation}/${frame}/${profile.id}/${template.id}`,
              ).not.toThrow();
              const canvas = canonicalCanvas(project);
              const legacy =
                canvas.height === 1920 &&
                ["android", "ios"].includes(device) &&
                orientation === "portrait";
              if (legacy) {
                expect(shot.phone).toEqual(template.phone);
                continue;
              }
              const geometry = deviceGeometry(
                device,
                shot.phone.width,
                frame,
                orientation,
              );
              const radians = (Math.abs(shot.phone.rotation) * Math.PI) / 180;
              const boundW =
                geometry.width * Math.cos(radians) +
                geometry.height * Math.sin(radians);
              const boundH =
                geometry.height * Math.cos(radians) +
                geometry.width * Math.sin(radians);
              const cx = shot.phone.x + geometry.width / 2,
                cy = shot.phone.y + geometry.height / 2;
              expect(cx - boundW / 2).toBeGreaterThanOrEqual(-1);
              expect(cx + boundW / 2).toBeLessThanOrEqual(canvas.width + 1);
              expect(cy - boundH / 2).toBeGreaterThanOrEqual(-1);
              expect(cy + boundH / 2).toBeLessThanOrEqual(canvas.height + 1);
              expect(shot.phone.width).toBeGreaterThanOrEqual(
                PLACEMENT_LIMITS.width.min,
              );
              const preview = templatePreview(
                project,
                shot,
                template.id,
                false,
              );
              expect(preview.phone).toEqual(shot.phone);
            }
  });
  it("reflows a format change while keeping source, captions, device and colors", () => {
    const project = createProject();
    project.shots = [createShot("image", 0)];
    project.shots[0].style = {
      device: "laptop",
      template: "editorial",
      background: "#AABBCC",
    };
    const original = structuredClone(project);
    changeExportProfile(project, "apple-mac");
    expect(project.exportProfile).toBe("apple-mac");
    expect({ ...project.shots[0], phone: original.shots[0].phone }).toEqual(
      original.shots[0],
    );
    expect(project.shots[0].phone).toEqual(
      templateLayout(project, resolveStyle(project, project.shots[0])).phone,
    );
    expect(project.style).toEqual(original.style);
    const after = structuredClone(project);
    changeExportProfile(project, "apple-mac");
    expect(project).toEqual(after);
  });
});
