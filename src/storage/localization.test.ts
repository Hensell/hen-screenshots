import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { createProject, createShot, type Asset } from "../core/model";
import { addLanguage, localContent, writeText } from "../core/localization";
import { saveProject, loadProject } from "./repository";
import { useEditor } from "../editor/store";
const image = (id: string): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 1,
  height: 1,
  blob: new Blob([id]),
});
describe("localization persistence and history", () => {
  it("requires localized image assets and retains both originals and versions", async () => {
    const p = createProject();
    p.shots = [createShot("original", 0)];
    addLanguage(p, "en", "es");
    localContent(p.shots[0], "es").assetId = "spanish";
    await expect(saveProject(p, [image("original")], 0)).rejects.toThrow(
      "missing",
    );
    expect(await saveProject(p, [image("original"), image("spanish")], 0)).toBe(
      1,
    );
    const loaded = await loadProject(p.id);
    expect(loaded.project).toEqual(p);
    expect(loaded.assets).toHaveLength(2);
    await expect(saveProject(p, [], 0)).rejects.toThrow("another tab");
  });
  it("undoes a language creation or text edit as one operation and redoes without losing words", () => {
    const p = createProject();
    p.shots = [createShot("original", 0)];
    useEditor.getState().open({ project: p, assets: [], revision: 0 });
    useEditor.getState().edit((draft) => addLanguage(draft, "en", "es"));
    useEditor.getState().setLocale("es");
    useEditor
      .getState()
      .edit((draft) => writeText(draft.shots[0], "es", "title", "Hola"));
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].translations!.es.title).toBe(
      p.shots[0].title,
    );
    useEditor.getState().undo();
    expect(useEditor.getState().project!.localization).toBeUndefined();
    useEditor.getState().redo();
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[0].translations!.es.title).toBe(
      "Hola",
    );
    expect(useEditor.getState().project!.shots[0].title).toBe(p.shots[0].title);
    useEditor.getState().close();
  });
});
