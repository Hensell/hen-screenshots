import { SCHEMA_VERSION } from "./model";
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  LIMITS,
  migrateProject,
  validateProject,
} from "./model";
import { addEmptySlide } from "./slides";
import {
  addLanguage,
  localizedProject,
  referencedAssetIds,
} from "./localization";
import { setDeviceImage, resolveDeviceElement } from "./device-composition";
import { applyTemplate } from "./templates";
import { duplicateUnit, editLinkedShots } from "./panorama";
import { sceneAssetIds } from "./overlays";
import { exportProject, importProject } from "../storage/backup";
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
} from "../storage/repository";
import { useEditor } from "../editor/store";

afterEach(async () => {
  useEditor.getState().close();
  for (const { project } of await listProjects())
    await deleteProject(project.id);
});

describe("slides without a screenshot", () => {
  it("creates an editable blank draft and preserves it through save, reopen and a portable backup", async () => {
    const project = createProject("Blank draft");
    const id = addEmptySlide(project);
    expect(id).toBe(project.shots[0].id);
    expect(project.shots[0]).toMatchObject({
      assetId: null,
      title: "",
      subtitle: "",
    });
    project.shots[0].title = "Designed before the capture";
    project.shots[0].phone.x = 117;
    project.shots[0].style.background = "#FFAACC";
    expect(referencedAssetIds(project)).toEqual([]);
    expect(() => validateProject(project)).not.toThrow();
    await saveProject(project, [], 0);
    expect((await loadProject(project.id)).project).toEqual(project);
    const restored = await importProject(
      new File([await exportProject(project, [])], "draft.henscreenshots"),
    );
    expect(restored.assets).toEqual([]);
    expect(restored.project.shots[0]).toEqual({
      ...project.shots[0],
      id: restored.project.shots[0].id,
    });
    expect(restored.project.shots[0].id).not.toBe(id);
  });

  it("undoes and redoes creation and image insertion without resetting the authored design", () => {
    useEditor
      .getState()
      .open({ project: createProject(), assets: [], revision: 0 });
    useEditor.getState().edit(addEmptySlide);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots).toHaveLength(0);
    useEditor.getState().redo();
    useEditor.getState().edit((draft) => {
      draft.shots[0].title = "Keep this";
      draft.shots[0].phone.rotation = 12;
    });
    const before = structuredClone(useEditor.getState().project!.shots[0]);
    useEditor
      .getState()
      .edit((draft) =>
        setDeviceImage(draft.shots[0], "device", "capture", null),
      );
    expect(useEditor.getState().project!.shots[0]).toEqual({
      ...before,
      assetId: "capture",
    });
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0]).toEqual(before);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[0].assetId).toBe("capture");
  });

  it("supports blank panoramas, duplication and a translated image without requiring an original capture", async () => {
    const project = createProject();
    const id = addEmptySlide(project)!;
    applyTemplate(project, id, "panorama", false);
    duplicateUnit(project, id);
    expect(project.shots).toHaveLength(4);
    expect(project.shots.every((shot) => shot.assetId === null)).toBe(true);
    expect(() => validateProject(project)).not.toThrow();
    const restored = await importProject(
      new File([await exportProject(project, [])], "panorama.henscreenshots"),
    );
    expect(restored.project.shots).toHaveLength(4);
    addLanguage(project, "en", "es");
    editLinkedShots(project, id, (shot) =>
      setDeviceImage(shot, "device", "spanish-capture", "es"),
    );
    expect(referencedAssetIds(project)).toEqual(["spanish-capture"]);
    expect(sceneAssetIds(project, project.shots[0])).toEqual([]);
    expect(localizedProject(project, "es").shots[0].assetId).toBe(
      "spanish-capture",
    );
    expect(() => validateProject(project)).not.toThrow();
  });

  it("backs up and restores empty slots in multi-device templates", async () => {
    const project = createProject();
    const id = addEmptySlide(project)!;
    applyTemplate(project, id, "ecosystem", false);
    expect(
      project.shots[0].companions!.every((device) => device.assetId === null),
    ).toBe(true);
    const restored = await importProject(
      new File([await exportProject(project, [])], "devices.henscreenshots"),
    );
    expect(restored.project.shots[0].companions).toEqual(
      project.shots[0].companions,
    );
    expect(referencedAssetIds(restored.project)).toEqual([]);
  });

  it("fills the current primary slot after a previous companion selection becomes stale", () => {
    const project = createProject();
    const first = addEmptySlide(project)!;
    applyTemplate(project, first, "ecosystem", false);
    expect(resolveDeviceElement(project.shots[0], "device:secondary")).toBe(
      "device:secondary",
    );
    addEmptySlide(project);
    const blank = project.shots[1];
    setDeviceImage(
      blank,
      resolveDeviceElement(blank, "device:secondary"),
      "new-capture",
      null,
    );
    expect(blank.assetId).toBe("new-capture");
    expect(project.shots[0].companions![0].assetId).toBeNull();
    applyTemplate(project, first, "classic", false);
    setDeviceImage(
      project.shots[0],
      resolveDeviceElement(project.shots[0], "device:tertiary"),
      "another-capture",
      null,
    );
    expect(project.shots[0].assetId).toBe("another-capture");
    expect(referencedAssetIds(project)).toEqual([
      "another-capture",
      "new-capture",
    ]);
  });

  it("keeps the slide limit and does not change a full project", () => {
    const project = createProject();
    for (let i = 0; i < LIMITS.shots; i++)
      expect(addEmptySlide(project)).toBeTruthy();
    const before = structuredClone(project);
    expect(addEmptySlide(project)).toBeNull();
    expect(project).toEqual(before);
  });

  it("migrates schema 9 and still rejects missing files and malformed asset IDs", async () => {
    const old = {
      ...createProject(),
      schemaVersion: 9 as const,
      shots: [createShot("real-image", 0)],
    };
    const migrated = migrateProject(old);
    expect(migrated).toEqual({ ...old, schemaVersion: SCHEMA_VERSION });
    expect(old.schemaVersion).toBe(9);
    await expect(saveProject(migrated, [], 0)).rejects.toThrow("missing");
    for (const bad of [null, undefined, ""]) {
      expect(() =>
        validateProject({ ...old, shots: [{ ...old.shots[0], assetId: bad }] }),
      ).toThrow();
    }
    for (const bad of [undefined, ""]) {
      expect(() =>
        validateProject({
          ...migrated,
          shots: [{ ...migrated.shots[0], assetId: bad }],
        }),
      ).toThrow();
    }
  });
});
