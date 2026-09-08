import { isPanoramaTemplate } from "./panorama-families";
import { describe, expect, it } from "vitest";
import {
  canonicalCanvas,
  exportProfiles,
  getExportProfile,
  resolveExportProfile,
  exportProfileSuffix,
  validateCustomSize,
  validateDimensions,
  validateExportPng,
} from "./export-profiles";
import {
  createProject,
  createShot,
  PLACEMENT_LIMITS,
  resolveStyle,
  validateProject,
  legacyTemplateIds,
  type DeviceFamily,
} from "./model";
import {
  changeExportProfile,
  changeCustomSize,
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
  it.each([
    "card",
    "android",
    "ios",
    "ipad",
    "android-tablet",
    "monitor",
    "laptop",
  ] as DeviceFamily[])(
    "fits rotated %s devices for every template, orientation and export size",
    (device) => {
      for (const orientation of ["portrait", "landscape"] as const)
        for (const frame of [true, false])
          for (const profile of exportProfiles)
            for (const template of templates.filter(
              (item) => !isPanoramaTemplate(item.id),
            )) {
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
                legacyTemplateIds.some((id) => id === template.id) &&
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
    },
  );
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

describe("custom portfolio sizes", () => {
  it("resolves custom dimensions everywhere while leaving store presets exact", () => {
    const project = createProject();
    project.exportProfile = "portfolio-custom";
    project.customSize = { width: 1537, height: 1103 };
    const profile = resolveExportProfile(project);
    expect(profile).toMatchObject({
      width: 1537,
      height: 1103,
      store: "presentation",
    });
    expect(canonicalCanvas(project)).toEqual({
      width: 1080,
      height: (1080 * 1103) / 1537,
    });
    expect(exportProfileSuffix(project)).toBe("portfolio-custom-1537x1103");
    project.exportProfile = "apple-mac";
    expect(resolveExportProfile(project)).toMatchObject({
      width: 2880,
      height: 1800,
      store: "apple",
    });
  });

  it.each([
    { width: 0, height: 1000 },
    { width: 255, height: 1000 },
    { width: 4097, height: 2000 },
    { width: 800.5, height: 1000 },
    { width: NaN, height: 1000 },
    { width: 1000, height: Infinity },
    { width: 256, height: 4096 },
  ])("rejects invalid or excessive size %j", (size) => {
    expect(() => validateCustomSize(size)).toThrow();
    const project = createProject();
    project.exportProfile = "portfolio-custom";
    const before = structuredClone(project);
    expect(() => changeCustomSize(project, size)).toThrow();
    expect(project).toEqual(before);
  });

  it("checks the encoded PNG against the chosen custom size", async () => {
    const project = createProject();
    project.exportProfile = "portfolio-custom";
    project.customSize = { width: 1537, height: 1103 };
    const profile = resolveExportProfile(project);
    await expect(
      validateExportPng(pngHeader(1537, 1103), profile),
    ).resolves.toBeUndefined();
    await expect(
      validateExportPng(pngHeader(1600, 1200), profile),
    ).rejects.toThrow(/dimensions/);
  });

  it("refits every template and device even at the supported aspect ratio extremes", () => {
    for (const size of [
      { width: 4096, height: 1024 },
      { width: 1024, height: 4096 },
      { width: 256, height: 256 },
      { width: 4096, height: 4096 },
      { width: 1537, height: 1103 },
    ])
      for (const device of [
        "card",
        "ios",
        "android",
        "ipad",
        "android-tablet",
        "monitor",
        "laptop",
      ] as DeviceFamily[])
        for (const orientation of ["portrait", "landscape"] as const)
          for (const template of templates.filter(
            (item) => !isPanoramaTemplate(item.id),
          )) {
            const project = createProject();
            project.exportProfile = "portfolio-custom";
            project.customSize = { ...size };
            Object.assign(project.style, {
              device,
              deviceOrientation: orientation,
              template: template.id,
            });
            const shot = createShot("image", 0);
            project.shots = [shot];
            resetComposition(project, shot);
            expect(
              () => validateProject(project),
              `${JSON.stringify(size)}/${device}/${orientation}/${template.id}`,
            ).not.toThrow();
            const canvas = canonicalCanvas(project),
              geo = deviceGeometry(device, shot.phone.width, true, orientation),
              radians = (Math.abs(shot.phone.rotation) * Math.PI) / 180;
            const w =
                geo.width * Math.cos(radians) + geo.height * Math.sin(radians),
              h =
                geo.height * Math.cos(radians) + geo.width * Math.sin(radians);
            const x = shot.phone.x + geo.width / 2,
              y = shot.phone.y + geo.height / 2;
            expect(x - w / 2).toBeGreaterThanOrEqual(-1);
            expect(x + w / 2).toBeLessThanOrEqual(canvas.width + 1);
            expect(y - h / 2).toBeGreaterThanOrEqual(-1);
            expect(y + h / 2).toBeLessThanOrEqual(canvas.height + 1);
          }
  });
});
