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
});
