import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { createProject, createShot, migrateProject } from "../core/model";
import type { V3Project } from "../core/model";

const { customSize: _size, ...base } = createProject("Tablet collection");
const existing: V3Project = {
  ...base,
  schemaVersion: 3,
  exportProfile: "apple-ipad13-landscape",
  style: {
    ...base.style,
    device: "ipad",
    deviceOrientation: "landscape",
    template: "editorial",
  },
  shots: [
    {
      ...createShot("existing-asset", 0),
      style: { device: "monitor", template: "spotlight" },
      phone: { x: -250, y: -30, width: 1000, rotation: 6 },
    },
  ],
};

describe("version 3 project migration", () => {
  it("adds only a default custom size while retaining the selected output and authored device composition", () => {
    const source = structuredClone(existing);
    expect(migrateProject(source)).toEqual({
      ...existing,
      schemaVersion: 6,
      customSize: { width: 1600, height: 1200 },
    });
    expect(source).toEqual(existing);
  });

  it("upgrades an installed schema 3 database and retains custom sizes across preset changes", async () => {
    const old = new Dexie("hen-screenshots");
    old.version(3).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    const blob = new Blob([new Uint8Array([3, 5, 11, 23])], {
      type: "image/png",
    });
    await old.open();
    await old.table("projects").put({
      id: existing.id,
      updatedAt: existing.updatedAt,
      revision: 6,
      project: existing,
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

    const { loadProject, saveProject, deleteProject } =
      await import("./repository");
    const loaded = await loadProject(existing.id);
    expect(loaded.project).toEqual(migrateProject(existing));
    expect(loaded.revision).toBe(6);
    expect(loaded.assets).toHaveLength(1);
    expect(await loaded.assets[0].blob.arrayBuffer()).toEqual(
      await blob.arrayBuffer(),
    );
    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      expect(inspector.verno).toBe(5);
      expect(
        (await inspector.table("projects").get(existing.id)).project,
      ).toEqual(loaded.project);
      const custom = {
        ...loaded.project,
        exportProfile: "portfolio-custom" as const,
        customSize: { width: 3600, height: 900 },
        style: { ...loaded.project.style, device: "card" as const },
      };
      custom.shots[0].phone.width = 32;
      expect(await saveProject(custom, [], 6)).toBe(7);
      expect((await loadProject(existing.id)).project).toEqual(custom);
      const storePreset = { ...custom, exportProfile: "apple-mac" as const };
      expect(await saveProject(storePreset, [], 7)).toBe(8);
      expect((await loadProject(existing.id)).project).toEqual(storePreset);
      expect(await saveProject(custom, [], 8)).toBe(9);
      expect((await loadProject(existing.id)).project.customSize).toEqual({
        width: 3600,
        height: 900,
      });
    } finally {
      inspector.close();
      await deleteProject(existing.id);
    }
  });
});
