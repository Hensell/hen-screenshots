import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  migrateProject,
  SCHEMA_VERSION,
  validateProject,
  LIMITS,
  type Asset,
  type V10Project,
} from "./model";
import {
  captureTemplate,
  instantiateTemplate,
  appendTemplate,
  templateAppendIssue,
  validateTemplate,
} from "./custom-templates";
import { addLanguage, referencedAssetIds } from "./localization";
import { applyTemplate } from "./templates";
import { addOverlay, sceneAssetIds } from "./overlays";
import { applyBrandKit } from "./brand-application";
import { newBrandKit } from "./brand-kit";

const image = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 100,
  height: 200,
  blob: new Blob([id]),
});
function fixture(template: "classic" | "panorama" | "ecosystem" = "classic") {
  const project = createProject("Private project");
  project.shots = [createShot("private-capture", 0)];
  applyTemplate(project, project.shots[0].id, template, false);
  for (const shot of project.shots)
    shot.backgroundImage = { assetId: "art", fit: "cover", opacity: 0.7 };
  addOverlay(project, project.shots[0], image("logo"));
  const assets = [
    image("private-capture"),
    image("art"),
    image("logo"),
    image("unused"),
  ];
  return { project, assets, revision: 0 };
}
describe("personal templates", () => {
  it.each(["classic", "panorama", "ecosystem"] as const)(
    "captures %s as an editable scene without screenshot or project metadata",
    (template) => {
      const source = fixture(template);
      applyBrandKit(
        source.project,
        newBrandKit(),
        source.project.shots[0].id,
        true,
      );
      addLanguage(source.project, "en", "es");
      const before = structuredClone(source.project);
      const result = captureTemplate(
        source.project,
        source.project.shots.at(-1)!.id,
        " My design ",
        source.assets,
      );
      expect(source.project).toEqual(before);
      validateTemplate(result);
      expect(result.project.name).toBe("My design");
      expect(result.project.brand).toBeUndefined();
      expect(result.project.brands).toBeUndefined();
      expect(result.project.localization).toBeUndefined();
      expect(result.assets.map((asset) => asset.id).sort()).toEqual([
        "art",
        "logo",
      ]);
      result.project.shots.forEach((shot, index) => {
        expect(shot.assetId).toBeNull();
        expect(shot.translations).toBeUndefined();
        expect(shot.brand).toBeUndefined();
        expect(shot.phone).toEqual(source.project.shots[index].phone);
        expect(shot.title).toEqual(source.project.shots[index].title);
        expect(
          shot.companions?.every((device) => device.assetId === null) ?? true,
        ).toBe(true);
      });
    },
  );
  it("reuses a panorama atomically, with independent IDs and retained editable placement", () => {
    const source = fixture("panorama");
    source.project.shots[0].textOffsets = { title: { x: 12, y: 21 } };
    const template = captureTemplate(
      source.project,
      source.project.shots[0].id,
      "Panorama",
      source.assets,
    );
    const target = createProject();
    const copy = appendTemplate(target, template, []);
    validateProject(target);
    expect(target.shots).toHaveLength(2);
    expect(target.shots[0].textOffsets).toEqual({ title: { x: 12, y: 21 } });
    expect(target.shots[0].id).not.toBe(template.project.shots[0].id);
    expect(target.shots[0].backgroundImage!.assetId).toBe(
      target.shots[1].backgroundImage!.assetId,
    );
    expect(new Set(referencedAssetIds(target))).toEqual(
      new Set(copy.assets.map((asset) => asset.id)),
    );
    const other = instantiateTemplate(template);
    expect(
      other.assets.every(
        (asset) => !copy.assets.some((old) => old.id === asset.id),
      ),
    ).toBe(true);
    target.shots[0].title = "Edited";
    expect(template.project.shots[0].title).not.toBe("Edited");
  });
  it("rejects size, workspace, capacity and byte-limit mismatches before changing a project", () => {
    const source = fixture();
    const template = captureTemplate(
      source.project,
      source.project.shots[0].id,
      "Test",
      source.assets,
    );
    const target = createProject();
    target.exportProfile = "play-phone-landscape";
    expect(templateAppendIssue(target, template.project)).toMatch(
      /different canvas/,
    );
    const before = structuredClone(target);
    expect(() => appendTemplate(target, template, [])).toThrow();
    expect(target).toEqual(before);
    target.exportProfile = "play-phone-portrait";
    target.shots = Array.from({ length: 8 }, (_, index) =>
      createShot("capture", index),
    );
    expect(templateAppendIssue(target, template.project)).toMatch(
      /not enough room/,
    );
    target.shots = [createShot("capture", 0)];
    const huge = {
      ...image("capture"),
      blob: { size: LIMITS.totalBytes } as Blob,
    };
    expect(() => appendTemplate(target, template, [huge])).toThrow(/120 MB/);
    expect(target.shots).toHaveLength(1);
  });
  it("retains backgrounds as scene assets and refuses disconnected panorama backgrounds", () => {
    const { project } = fixture("panorama");
    expect(sceneAssetIds(project, project.shots[1])).toContain("art");
    project.shots[1].backgroundImage!.opacity = 0.5;
    expect(() => validateProject(project)).toThrow(/disconnected/);
  });
  it("migrates schema 10 without changing its design and validates background properties", () => {
    const legacy: V10Project = {
      ...createProject(),
      schemaVersion: 10,
      shots: [createShot("capture", 0)],
    };
    expect(migrateProject(legacy)).toEqual({
      ...legacy,
      schemaVersion: SCHEMA_VERSION,
    });
    const { project } = fixture();
    for (const patch of [
      { opacity: NaN },
      { opacity: 2 },
      { fit: "stretch" },
      { assetId: "../../private" },
    ]) {
      const copy = structuredClone(project);
      Object.assign(copy.shots[0].backgroundImage!, patch);
      expect(() => validateProject(copy)).toThrow();
    }
  });
});
