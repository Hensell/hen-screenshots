import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject, createShot } from "../core/model";
import type { Asset, LoadedProject } from "../core/model";
import { ConflictError, saveProject } from "../storage/repository";
import { saveNow, useEditor } from "./store";

vi.mock("../storage/repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../storage/repository")>()),
  saveProject: vi.fn(),
}));
const persist = vi.mocked(saveProject);
const asset = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 1,
  height: 1,
  blob: new Blob([id]),
});
function loaded(revision = 1): LoadedProject {
  return {
    project: { ...createProject("My app"), shots: [createShot("image-a", 0)] },
    assets: [asset("image-a")],
    revision,
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  useEditor.getState().close();
  persist.mockReset();
});
afterEach(async () => {
  useEditor.getState().close();
  await saveNow();
});

describe("serialized autosave", () => {
  it("saves a new empty project even before its first edit", async () => {
    const initial = loaded(0);
    initial.project.shots = [];
    initial.assets = [];
    useEditor.getState().open(initial);
    persist.mockResolvedValue(1);
    expect(useEditor.getState().savedChange).toBe(-1);
    expect(await saveNow()).toBe(true);
    expect(persist).toHaveBeenCalledWith(initial.project, [], 0);
    expect(useEditor.getState()).toMatchObject({
      revision: 1,
      status: "saved",
      savedChange: 0,
    });
  });

  it("serializes writes and drains edits made while the previous revision is saving", async () => {
    useEditor.getState().open(loaded());
    const first = deferred<number>(),
      second = deferred<number>();
    persist
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    useEditor.getState().edit((project) => {
      project.name = "First edit";
    });
    const completion = saveNow();
    useEditor.getState().edit((project) => {
      project.name = "Latest edit";
    });
    expect(saveNow()).toBe(completion);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0][0].name).toBe("First edit");
    first.resolve(2);
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(2), {
      interval: 1,
    });
    expect(persist.mock.calls[1][0].name).toBe("Latest edit");
    expect(persist.mock.calls[1][2]).toBe(2);
    expect(useEditor.getState()).toMatchObject({
      savedChange: 1,
      change: 2,
      status: "saving",
    });
    second.resolve(3);
    expect(await completion).toBe(true);
    expect(useEditor.getState()).toMatchObject({
      revision: 3,
      status: "saved",
      savedChange: 2,
      change: 2,
    });
  });

  it("retains all unsaved edits after a failure and retries the latest document", async () => {
    useEditor.getState().open(loaded());
    const failed = deferred<number>();
    persist.mockReturnValueOnce(failed.promise);
    useEditor.getState().edit((project) => {
      project.name = "First edit";
    });
    const completion = saveNow();
    useEditor.getState().edit((project) => {
      project.name = "Keep this latest edit";
    });
    failed.reject(new Error("Storage is full"));
    expect(await completion).toBe(false);
    expect(useEditor.getState()).toMatchObject({
      revision: 1,
      savedChange: 0,
      change: 2,
      status: "error",
      saveError: "Storage is full",
    });
    useEditor.getState().edit((project) => {
      project.shots[0].title = "Still editable after failure";
    });
    expect(useEditor.getState().status).toBe("error");
    persist.mockResolvedValueOnce(2);
    expect(await saveNow()).toBe(true);
    expect(persist.mock.lastCall?.[0]).toMatchObject({
      name: "Keep this latest edit",
      shots: [{ title: "Still editable after failure" }],
    });
    expect(persist.mock.lastCall?.[2]).toBe(1);
    expect(useEditor.getState()).toMatchObject({
      revision: 2,
      status: "saved",
      saveError: null,
      savedChange: 3,
      change: 3,
    });
  });

  it("recovers a revision conflict as a new copy without overwriting the original project", async () => {
    const initial = loaded();
    initial.project.name = "A".repeat(80);
    useEditor.getState().open(initial);
    useEditor.getState().edit((project) => {
      project.shots[0].title = "Preserve my local changes";
    });
    persist.mockRejectedValueOnce(new ConflictError());
    expect(await saveNow()).toBe(false);
    useEditor.getState().saveAsCopy();
    const copy = useEditor.getState();
    expect(copy.project!.id).not.toBe(initial.project.id);
    expect(copy.project!.name).toHaveLength(80);
    expect(copy.project!.name).toMatch(/ \(copy\)$/);
    expect(copy.project!.shots[0].title).toBe("Preserve my local changes");
    expect(copy.assets).toBe(initial.assets);
    expect(copy).toMatchObject({
      revision: 0,
      status: "pending",
      saveError: null,
      savedChange: -1,
      past: [],
      future: [],
    });
    persist.mockResolvedValueOnce(1);
    expect(await saveNow()).toBe(true);
    expect(persist.mock.calls.map((call) => [call[0].id, call[2]])).toEqual([
      [initial.project.id, 1],
      [copy.project!.id, 0],
    ]);
  });

  it("does not create a copy during an active write, even when another edit changes the status", async () => {
    const initial = loaded();
    useEditor.getState().open(initial);
    useEditor.getState().edit((project) => {
      project.name = "Before writing";
    });
    const write = deferred<number>();
    persist.mockReturnValueOnce(write.promise).mockResolvedValueOnce(3);
    const completion = saveNow();
    useEditor.getState().edit((project) => {
      project.name = "Edited during the write";
    });
    useEditor.getState().saveAsCopy();
    const idDuringWrite = useEditor.getState().project!.id;
    write.resolve(2);
    await completion;
    expect(idDuringWrite).toBe(initial.project.id);
  });

  it("does not attach an old write error to another project opened in the meantime", async () => {
    useEditor.getState().open(loaded());
    useEditor.getState().edit((project) => {
      project.name = "Old project change";
    });
    const write = deferred<number>();
    persist.mockReturnValueOnce(write.promise);
    const completion = saveNow();
    const current = loaded(4);
    useEditor.getState().open(current);
    write.reject(new Error("Old project failed"));
    await completion;
    expect(useEditor.getState()).toMatchObject({
      project: current.project,
      revision: 4,
      status: "saved",
      saveError: null,
      change: 0,
      savedChange: 0,
    });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("does not apply completion counters from an older session of the same project", async () => {
    const initial = loaded();
    useEditor.getState().open(initial);
    useEditor.getState().edit((project) => {
      project.name = "Old session edit";
    });
    const write = deferred<number>();
    persist.mockReturnValueOnce(write.promise).mockResolvedValue(3);
    const completion = saveNow();
    useEditor.getState().open({ ...initial, revision: 2 });
    write.resolve(2);
    await completion;
    expect(useEditor.getState()).toMatchObject({
      revision: 2,
      savedChange: 0,
      change: 0,
      status: "saved",
    });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("continues the queue for a new unsaved project opened during an older write", async () => {
    useEditor.getState().open(loaded());
    useEditor.getState().edit((project) => {
      project.name = "Old session edit";
    });
    const write = deferred<number>();
    persist.mockReturnValueOnce(write.promise).mockResolvedValueOnce(1);
    const completion = saveNow();
    const next = loaded(0);
    useEditor.getState().open(next);
    expect(saveNow()).toBe(completion);
    write.resolve(2);
    expect(await completion).toBe(true);
    expect(persist).toHaveBeenLastCalledWith(next.project, next.assets, 0);
    expect(useEditor.getState()).toMatchObject({
      revision: 1,
      savedChange: 0,
      change: 0,
      status: "saved",
    });
  });
});

describe("document history", () => {
  it("retains original image assets across replacement, removal, undo and redo", () => {
    const initial = loaded();
    useEditor.getState().open(initial);
    useEditor.getState().addAssets([asset("image-b")]);
    useEditor.getState().edit((project) => {
      project.shots[0].assetId = "image-b";
    });
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].assetId).toBe("image-a");
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[0].assetId).toBe("image-b");
    useEditor.getState().edit((project) => {
      project.shots = [];
    });
    expect(useEditor.getState().selectedId).toBeNull();
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].assetId).toBe("image-b");
    expect(useEditor.getState().selectedId).toBe(initial.project.shots[0].id);
    expect(useEditor.getState().assets.map((asset) => asset.id)).toEqual([
      "image-a",
      "image-b",
    ]);
    expect(useEditor.getState().status).toBe("pending");
  });

  it("groups a typing gesture, separates the next gesture and discards redo after a new edit", () => {
    const initial = loaded();
    const originalTitle = initial.project.shots[0].title;
    useEditor.getState().open(initial);
    useEditor.getState().edit((project) => {
      project.shots[0].title = "H";
    }, "headline");
    useEditor.getState().edit((project) => {
      project.shots[0].title = "Hello";
    }, "headline");
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().endGroup();
    useEditor.getState().edit((project) => {
      project.style.background = "#ffffff";
    }, "background");
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].title).toBe("Hello");
    expect(useEditor.getState().project!.style.background).toBe(
      initial.project.style.background,
    );
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].title).toBe(originalTitle);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[0].title).toBe("Hello");
    useEditor.getState().edit((project) => {
      project.name = "New direction";
    });
    expect(useEditor.getState().future).toEqual([]);
    const change = useEditor.getState().change;
    useEditor.getState().edit((project) => {
      project.name = "New direction";
    });
    expect(useEditor.getState().change).toBe(change);
  });
});
