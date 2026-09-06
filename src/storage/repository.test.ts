import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import Dexie from "dexie";
import { createProject, createShot } from "../core/model";
import type { Asset } from "../core/model";
import {
  ConflictError,
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
} from "./repository";

const asset = (id = "image-a"): Asset => ({
  id,
  name: "screen.png",
  mime: "image/png",
  width: 10,
  height: 20,
  blob: new Blob(["image"]),
});
const project = () => ({
  ...createProject("My app"),
  shots: [createShot("image-a", 0)],
});

afterEach(async () => {
  vi.restoreAllMocks();
  for (const { project } of await listProjects())
    await deleteProject(project.id);
});

describe("local project persistence", () => {
  it.each(["", "   "])(
    "normalizes a temporarily blank name %j on save without mutating the input",
    async (name) => {
      const original = { ...project(), name };
      const before = structuredClone(original);
      expect(await saveProject(original, [asset()], 0)).toBe(1);
      expect(original).toEqual(before);
      const loaded = await loadProject(original.id);
      expect(loaded.project).toEqual({ ...before, name: "Untitled app" });
      expect(loaded.revision).toBe(1);
      expect(loaded.assets).toHaveLength(1);
      expect((await listProjects())[0].project.name).toBe("Untitled app");
    },
  );
  it("normalizes a previously stored blank name on reads and subsequent saves", async () => {
    const original = project();
    await saveProject(original, [asset()], 0);
    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      await inspector
        .table("projects")
        .update(original.id, { project: { ...original, name: "" } });
      expect((await loadProject(original.id)).project.name).toBe(
        "Untitled app",
      );
      expect((await listProjects())[0].project.name).toBe("Untitled app");
      expect(
        await saveProject({ ...original, name: "Recovered name" }, [], 1),
      ).toBe(2);
      expect((await loadProject(original.id)).project.name).toBe(
        "Recovered name",
      );
    } finally {
      inspector.close();
    }
  });
  it("retains original image bytes and unused images for undo, with project-scoped IDs", async () => {
    const first = project();
    const second = { ...project(), updatedAt: first.updatedAt + 100 };
    await saveProject(first, [asset(), asset("old-image")], 0);
    await saveProject(
      second,
      [{ ...asset(), blob: new Blob(["different image"]) }],
      0,
    );
    const revision = await saveProject({ ...first, shots: [] }, [], 1);
    expect(revision).toBe(2);
    expect((await loadProject(first.id)).assets).toHaveLength(2);
    expect(
      await (
        await loadProject(first.id)
      ).assets
        .find((asset) => asset.id === "image-a")!
        .blob.text(),
    ).toBe("image");
    expect(await (await loadProject(second.id)).assets[0].blob.text()).toBe(
      "different image",
    );
    expect((await listProjects()).map((row) => row.project.id)).toEqual([
      second.id,
      first.id,
    ]);
    await deleteProject(first.id);
    expect((await loadProject(second.id)).assets).toHaveLength(1);
  });

  it("allows exactly one writer for the same revision and rejects a stale tab", async () => {
    const original = project();
    await saveProject(original, [asset()], 0);
    const results = await Promise.allSettled([
      saveProject({ ...original, name: "Tab one" }, [], 1),
      saveProject({ ...original, name: "Tab two" }, [], 1),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === "rejected",
    ) as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
    expect((await loadProject(original.id)).revision).toBe(2);
  });

  it("rolls back image writes if the document write fails, preserving the previous revision", async () => {
    const original = project();
    await saveProject(original, [asset()], 0);
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
      this: IDBObjectStore,
      value: unknown,
      key?: IDBValidKey,
    ) {
      if (this.name === "projects")
        throw new DOMException("Simulated full disk", "QuotaExceededError");
      return put.call(this, value, key);
    });
    await expect(
      saveProject(
        { ...original, name: "Should not persist" },
        [asset("new-image")],
        1,
      ),
    ).rejects.toThrow();
    vi.restoreAllMocks();
    const recovered = await loadProject(original.id);
    expect(recovered.project.name).toBe("My app");
    expect(recovered.revision).toBe(1);
    expect(recovered.assets.map((asset) => asset.id)).toEqual(["image-a"]);
  });

  it("rejects missing image references without leaving orphaned image rows", async () => {
    const original = project();
    await expect(saveProject(original, [asset("wrong-id")], 0)).rejects.toThrow(
      "missing",
    );
    expect(await listProjects()).toEqual([]);
    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      expect(await inspector.table("assets").count()).toBe(0);
    } finally {
      inspector.close();
    }
  });
  it("rejects invalid export profiles, device families and orientations before writing assets or revisions", async () => {
    const original = project();
    await saveProject(original, [asset()], 0);
    for (const changed of [
      { ...original, exportProfile: "unknown-preset" },
      { ...original, style: { ...original.style, device: "watch" } },
      {
        ...original,
        style: { ...original.style, deviceOrientation: "diagonal" },
      },
    ]) {
      await expect(
        saveProject(changed as typeof original, [asset("new-image")], 1),
      ).rejects.toThrow("invalid");
    }
    const loaded = await loadProject(original.id);
    expect(loaded.project).toEqual(original);
    expect(loaded.revision).toBe(1);
    expect(loaded.assets.map(({ id }) => id)).toEqual(["image-a"]);
  });
  it("refuses malformed schema 3 database rows instead of silently rendering a fallback", async () => {
    const original = project();
    await saveProject(original, [asset()], 0);
    const inspector = new Dexie("hen-screenshots");
    await inspector.open();
    try {
      await inspector.table("projects").update(original.id, {
        project: { ...original, exportProfile: "unknown-preset" },
      });
      await expect(loadProject(original.id)).rejects.toThrow("invalid");
      await expect(listProjects()).rejects.toThrow("invalid");
      await expect(
        saveProject(original, [asset("new-image")], 1),
      ).rejects.toThrow("invalid");
      expect(
        (await inspector.table("projects").get(original.id)).revision,
      ).toBe(1);
      expect(await inspector.table("assets").count()).toBe(1);
    } finally {
      inspector.close();
      await deleteProject(original.id);
    }
  });
});
