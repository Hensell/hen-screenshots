import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../storage/repository", () => ({ saveProject: vi.fn(async () => 1) }));
import {
  createProject,
  createShot,
  migrateProject,
  validateProject,
  type V4Project,
} from "./model";
import { moveText, resetText, textOffset } from "./text-placement";
import {
  applyTemplate,
  changeExportProfile,
  resetComposition,
  templatePreview,
} from "./templates";
import { duplicateUnit, panoramaPair } from "./panorama";
import { useEditor } from "../editor/store";

function fixture() {
  const project = createProject("Text placement");
  project.shots = [createShot("image", 0)];
  applyTemplate(project, project.shots[0].id, "daybreak");
  return project;
}
beforeEach(() => useEditor.getState().close());

describe("independent text placement", () => {
  it("moves only the requested text on one half of a panorama", () => {
    const project = fixture(),
      before = structuredClone(project);
    moveText(project.shots[1], "title", 85.4, -119.7);
    expect(project.shots[0]).toEqual(before.shots[0]);
    expect(project.shots[1]).toEqual({
      ...before.shots[1],
      textOffsets: { title: { x: 85, y: -120 } },
    });
    expect(panoramaPair(project, project.shots[1].id)).toHaveLength(2);
    validateProject(project);
  });
  it("resets one text without touching the other text, device or contents", () => {
    const project = fixture(),
      shot = project.shots[0],
      before = structuredClone(shot);
    moveText(shot, "title", 200, 300);
    moveText(shot, "subtitle", -200, 120);
    resetText(shot, "title");
    expect(textOffset(shot, "title")).toEqual({ x: 0, y: 0 });
    expect(shot).toEqual({
      ...before,
      textOffsets: { subtitle: { x: -200, y: 120 } },
    });
    resetText(shot, "subtitle");
    expect(shot).toEqual(before);
  });
  it("clamps movement to finite document bounds and clears zero offsets", () => {
    const shot = createShot("image", 0);
    moveText(shot, "title", 1e8, -1e8);
    expect(textOffset(shot, "title")).toEqual({ x: 2160, y: -4320 });
    moveText(shot, "title", NaN, Infinity);
    expect(textOffset(shot, "title")).toEqual({ x: 2160, y: -4320 });
    moveText(shot, "title", 0, 0);
    expect(shot.textOffsets).toBeUndefined();
  });
  it("supports undo/redo and independent duplicate positions", () => {
    const project = fixture();
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) => moveText(draft.shots[1], "subtitle", 120, 90));
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[1].textOffsets).toBeUndefined();
    useEditor.getState().redo();
    const draft = structuredClone(useEditor.getState().project!);
    const duplicate = duplicateUnit(draft, draft.shots[1].id)!;
    const copy = panoramaPair(draft, duplicate)!;
    expect(copy[1].textOffsets).toEqual(draft.shots[1].textOffsets);
    resetText(copy[1]);
    expect(draft.shots[1].textOffsets?.subtitle).toEqual({ x: 120, y: 90 });
  });
  it("resets text for new templates and formats, but preserves it when refitting just the device", () => {
    const project = fixture(),
      shot = project.shots[0];
    moveText(shot, "title", 120, 350);
    resetComposition(project, shot);
    expect(textOffset(shot, "title")).toEqual({ x: 120, y: 350 });
    const preview = templatePreview(project, shot, "bloom", false);
    expect(preview.textOffsets).toBeUndefined();
    expect(shot.textOffsets).toBeDefined();
    applyTemplate(project, shot.id, "bloom");
    expect(project.shots[0]).toEqual(preview);
    moveText(project.shots[0], "subtitle", 100, 100);
    changeExportProfile(project, "play-phone-landscape");
    expect(project.shots[0].textOffsets).toBeUndefined();
    moveText(project.shots[0], "title", 50, 50);
    applyTemplate(project, project.shots[0].id, "tidal");
    expect(
      project.shots.slice(0, 2).every((s) => s.textOffsets === undefined),
    ).toBe(true);
    validateProject(project);
  });
});

describe("version 5 text placement documents", () => {
  it("upgrades version 4 without changing custom formats, compositions or source data", () => {
    const project = fixture();
    project.exportProfile = "portfolio-custom";
    project.customSize = { width: 1537, height: 1103 };
    const old: V4Project = { ...project, schemaVersion: 4 };
    const before = structuredClone(old);
    const current = migrateProject(old);
    expect(current).toEqual({ ...old, schemaVersion: 10 });
    expect(old).toEqual(before);
    moveText(current.shots[0], "title", -800, 1000);
    expect(old).toEqual(before);
    validateProject(current);
  });
  it.each([
    null,
    [],
    { heading: { x: 0, y: 0 } },
    { title: { x: 0 } },
    { title: { x: NaN, y: 0 } },
    { title: { x: 0, y: Infinity } },
    { title: { x: 2161, y: 0 } },
    { subtitle: { x: 0, y: -4321 } },
    { title: { x: 0, y: 0, width: 200 } },
  ])("rejects malformed position metadata: %j", (offsets) => {
    const project = fixture();
    Object.assign(project.shots[0], { textOffsets: offsets });
    expect(() => validateProject(project)).toThrow();
  });
  it("does not accept text metadata mislabeled as a version 4 document", () => {
    const project = fixture();
    moveText(project.shots[0], "title", 50, 50);
    expect(() => validateProject({ ...project, schemaVersion: 4 })).toThrow();
  });
});
