import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { defaultStyle, migrateProject } from "../core/model";
import type { LegacyProject, Project } from "../core/model";

const legacyProject: LegacyProject = {
  schemaVersion: 1,
  id: "existing-project",
  name: "An existing app",
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_001_000,
  style: {
    background: "#123ABC",
    textColor: "#ABC123",
    device: "ios",
    frame: false,
    camera: true,
    fit: "cover",
    align: "left",
  },
  shots: [
    {
      id: "existing-shot",
      assetId: "existing-image",
      title: "Exactly my\nold headline",
      subtitle: "Original supporting text.",
      style: { background: "#FEDCBA", device: "android" },
      phone: { x: 279, y: 644, width: 723 },
    },
  ],
};

describe("version 1 project migration", () => {
  it("adds presentation defaults without mutating the source or changing identity, content or inherited overrides", () => {
    const original = structuredClone(legacyProject);
    const migrated = migrateProject(original);
    expect(original).toEqual(legacyProject);
    expect(migrated).toEqual({
      ...legacyProject,
      schemaVersion: 8,
      customSize: { width: 1600, height: 1200 },
      exportProfile: "play-phone-portrait",
      style: { ...defaultStyle, ...legacyProject.style },
      shots: [
        {
          ...legacyProject.shots[0],
          phone: { ...legacyProject.shots[0].phone, rotation: 0 },
        },
      ],
    });
    expect(migrateProject(migrated)).toBe(migrated);
    expect(() =>
      migrateProject({ ...migrated, schemaVersion: 9 } as unknown as Project),
    ).toThrow("unsupported project version");
  });

  it("upgrades an existing IndexedDB document atomically while retaining revisions, timestamps, IDs and original blobs", async () => {
    const oldDatabase = new Dexie("hen-screenshots");
    oldDatabase.version(1).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    const oldAsset = {
      id: "existing-image",
      projectId: legacyProject.id,
      name: "original.png",
      mime: "image/png",
      width: 10,
      height: 20,
      blob: new Blob([new Uint8Array([4, 2, 7, 9])], { type: "image/png" }),
    };
    await oldDatabase.open();
    await oldDatabase.transaction(
      "rw",
      oldDatabase.table("projects"),
      oldDatabase.table("assets"),
      async () => {
        await oldDatabase.table("projects").put({
          id: legacyProject.id,
          updatedAt: legacyProject.updatedAt,
          revision: 7,
          project: legacyProject,
        });
        await oldDatabase.table("assets").put(oldAsset);
      },
    );
    oldDatabase.close();

    const {
      loadProject,
      listProjects,
      saveProject,
      deleteProject,
      ConflictError,
    } = await import("./repository");
    const expected = migrateProject(legacyProject);
    const loaded = await loadProject(legacyProject.id);
    expect(loaded.project).toEqual(expected);
    expect(loaded.revision).toBe(7);
    expect(loaded.assets).toHaveLength(1);
    expect(loaded.assets[0].id).toBe(oldAsset.id);
    expect(loaded.assets[0].name).toBe(oldAsset.name);
    expect(loaded.assets[0].mime).toBe(oldAsset.mime);
    expect(await loaded.assets[0].blob.arrayBuffer()).toEqual(
      await oldAsset.blob.arrayBuffer(),
    );
    expect(await listProjects()).toEqual([{ project: expected, revision: 7 }]);

    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      expect(inspector.verno).toBe(5);
      expect(await inspector.table("projects").get(legacyProject.id)).toEqual({
        id: legacyProject.id,
        updatedAt: legacyProject.updatedAt,
        revision: 7,
        project: expected,
      });
      await expect(saveProject(expected, [], 6)).rejects.toBeInstanceOf(
        ConflictError,
      );
      expect(await saveProject(expected, [], 7)).toBe(8);
      expect(await inspector.table("assets").count()).toBe(1);

      await inspector.table("projects").update(legacyProject.id, {
        project: { ...expected, schemaVersion: 9 },
      });
      await expect(loadProject(legacyProject.id)).rejects.toThrow(
        "unsupported project version",
      );
      await expect(listProjects()).rejects.toThrow(
        "unsupported project version",
      );
      await expect(saveProject(expected, [], 8)).rejects.toThrow(
        "unsupported project version",
      );
      expect(
        (await inspector.table("projects").get(legacyProject.id)).project
          .schemaVersion,
      ).toBe(9);
    } finally {
      inspector.close();
      await deleteProject(legacyProject.id);
    }
  });
});
