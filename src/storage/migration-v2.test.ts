import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { createProject, createShot, migrateProject } from "../core/model";
import type { V2Project } from "../core/model";

const {
  exportProfile: _profile,
  style: currentStyle,
  ...project
} = createProject("Template collection");
const { deviceOrientation: _orientation, ...style } = currentStyle;
const existing: V2Project = {
  ...project,
  schemaVersion: 2,
  style: { ...style, device: "ios", template: "spotlight", titleSize: 106 },
  shots: [
    {
      ...createShot("existing-asset", 0),
      style: { template: "tilt", backgroundEnd: "#ABCD12" },
      phone: { x: 120, y: 622, width: 840, rotation: -12.5 },
    },
  ],
};

describe("version 2 project migration", () => {
  it("adds only the export preset and portrait orientation while preserving the authored template", () => {
    const source = structuredClone(existing);
    const migrated = migrateProject(source);
    expect(source).toEqual(existing);
    expect(migrated).toEqual({
      ...existing,
      schemaVersion: 3,
      exportProfile: "play-phone-portrait",
      style: { ...existing.style, deviceOrientation: "portrait" },
    });
  });

  it("upgrades an installed schema 2 database without losing revisions, original blobs or composition", async () => {
    const old = new Dexie("hen-screenshots");
    old.version(2).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    const blob = new Blob([new Uint8Array([1, 5, 9, 12])], {
      type: "image/png",
    });
    await old.open();
    await old.table("projects").put({
      id: existing.id,
      updatedAt: existing.updatedAt,
      revision: 14,
      project: existing,
    });
    const blankName: V2Project = {
      ...existing,
      id: "blank-name",
      name: "",
      shots: [],
    };
    await old
      .table("projects")
      .put({
        id: blankName.id,
        updatedAt: blankName.updatedAt,
        revision: 3,
        project: blankName,
      });
    await old.table("assets").put({
      id: "existing-asset",
      projectId: existing.id,
      name: "source.png",
      mime: "image/png",
      width: 12,
      height: 24,
      blob,
    });
    old.close();

    const { loadProject, listProjects, saveProject, deleteProject } =
      await import("./repository");
    const loaded = await loadProject(existing.id);
    expect(loaded.project).toEqual(migrateProject(existing));
    expect(loaded.revision).toBe(14);
    expect(loaded.assets).toHaveLength(1);
    expect(await loaded.assets[0].blob.arrayBuffer()).toEqual(
      await blob.arrayBuffer(),
    );
    expect(await loadProject(blankName.id)).toMatchObject({
      revision: 3,
      project: { id: blankName.id, name: "Untitled app", schemaVersion: 3 },
    });
    expect(
      (await listProjects()).find(({ project }) => project.id === blankName.id)
        ?.project.name,
    ).toBe("Untitled app");
    expect(blankName.name).toBe("");
    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      expect(inspector.verno).toBe(3);
      expect(
        (await inspector.table("projects").get(blankName.id)).project.name,
      ).toBe("Untitled app");
      expect(
        (await inspector.table("projects").get(existing.id)).project,
      ).toEqual(loaded.project);
      loaded.project.exportProfile = "apple-mac";
      loaded.project.style.device = "monitor";
      loaded.project.style.deviceOrientation = "landscape";
      loaded.project.shots[0].phone = {
        width: 1000,
        x: -400,
        y: -50,
        rotation: 0,
      };
      expect(await saveProject(loaded.project, [], 14)).toBe(15);
      expect((await loadProject(existing.id)).project).toEqual(loaded.project);
    } finally {
      inspector.close();
      await deleteProject(existing.id);
      await deleteProject(blankName.id);
    }
  });
});
