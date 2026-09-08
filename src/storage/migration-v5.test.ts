import "fake-indexeddb/auto";
import Dexie from "dexie";
import { describe, expect, it } from "vitest";
import { createProject, createShot, type V5Project } from "../core/model";
import { newBrandKit } from "../core/brand-kit";

describe("brand kit database upgrade", () => {
  it("adds the kit library while preserving existing project revisions, assets and composition", async () => {
    const project: V5Project = {
      ...createProject("Existing app"),
      schemaVersion: 5,
      shots: [createShot("original-image", 0)],
    };
    project.shots[0].textOffsets = { title: { x: 150, y: -25 } };
    const old = new Dexie("hen-screenshots");
    old
      .version(4)
      .stores({
        projects: "id, updatedAt",
        assets: "[projectId+id], projectId",
      });
    const blob = new Blob(["original image bytes"]);
    await old
      .table("projects")
      .put({
        id: project.id,
        project,
        revision: 8,
        updatedAt: project.updatedAt,
      });
    await old
      .table("assets")
      .put({
        id: "original-image",
        projectId: project.id,
        name: "original.png",
        mime: "image/png",
        width: 10,
        height: 20,
        blob,
      });
    old.close();
    const repository = await import("./repository");
    try {
      const loaded = await repository.loadProject(project.id);
      expect(loaded.project).toEqual({ ...project, schemaVersion: 6 });
      expect(loaded.revision).toBe(8);
      expect(await loaded.assets[0].blob.text()).toBe("original image bytes");
      expect(await repository.listBrandKits()).toEqual([]);
      const saved = await repository.saveBrandKit(newBrandKit("New brand"), 0);
      expect(await repository.listBrandKits()).toEqual([saved]);
      await repository.deleteBrandKit(saved.id, saved.revision);
    } finally {
      await repository.deleteProject(project.id);
    }
  });
});
