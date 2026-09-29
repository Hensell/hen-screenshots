import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
} from "./model";
import { copyShotStyle, pasteShotStyle } from "./style-clipboard";
import { applyTemplate, templateLayout } from "./templates";
import { useEditor } from "../editor/store";

function fixture() {
  const project = createProject("Styles");
  project.shots = [createShot("a", 0), createShot("b", 1)];
  project.shots[0].style = {
    template: "editorial",
    background: "#112233",
    textColor: "#445566",
    titleSize: 100,
    align: "left",
    accentTitle: true,
  };
  return project;
}

describe("style clipboard", () => {
  it("copies resolved fonts and weights, preserves content and geometry, and survives validation", () => {
    const project = fixture();
    const source = project.shots[0];
    const target = project.shots[1];
    const original = structuredClone(target);
    const copied = copyShotStyle(project, source);
    const template = templateLayout(project, resolveStyle(project, source));
    expect(copied.style.titleFont).toBe(template.titleFont ?? "Manrope");
    expect(copied.style.titleWeight).toBe(template.titleWeight ?? "800");
    source.style.background = "#FFFFFF";
    pasteShotStyle(project, target.id, copied, "all");
    expect(target).toEqual({
      ...original,
      style: { ...original.style, ...copied.style },
    });
    expect(resolveStyle(project, target).background).toBe("#112233");
    expect(() => validateProject(project)).not.toThrow();
  });

  it("pastes colors without changing typography, textures, or device", () => {
    const project = fixture();
    const before = structuredClone(project.shots[1]);
    const copied = copyShotStyle(project, project.shots[0]);
    pasteShotStyle(project, before.id, copied, "colors");
    expect(project.shots[1]).toEqual({
      ...before,
      style: {
        ...before.style,
        background: copied.style.background,
        backgroundEnd: copied.style.backgroundEnd,
        backgroundMode: copied.style.backgroundMode,
        textColor: copied.style.textColor,
        accentColor: copied.style.accentColor,
      },
    });
  });

  it("pastes all text attributes without changing colors or device", () => {
    const project = fixture();
    const target = project.shots[1];
    const before = resolveStyle(project, target);
    const copied = copyShotStyle(project, project.shots[0]);
    pasteShotStyle(project, target.id, copied, "typography");
    const after = resolveStyle(project, target);
    expect(after.background).toBe(before.background);
    expect(after.textColor).toBe(before.textColor);
    expect(after.device).toBe(before.device);
    for (const key of [
      "titleFont",
      "bodyFont",
      "titleWeight",
      "bodyWeight",
      "titleScale",
      "titleLineHeight",
      "subtitleOpacity",
      "titleSize",
      "subtitleSize",
      "align",
      "accentTitle",
    ] as const)
      expect(after[key]).toBe(copied.style[key]);
  });

  it("keeps linked panorama slides consistent", () => {
    const project = fixture();
    const copied = copyShotStyle(project, project.shots[0]);
    applyTemplate(project, project.shots[1].id, "panorama");
    pasteShotStyle(project, project.shots[1].id, copied, "typography");
    expect(project.shots[2].style.titleWeight).toBe(copied.style.titleWeight);
    expect(() => validateProject(project)).not.toThrow();
  });

  it("copy does not create history; paste is undoable and redoable", () => {
    const project = fixture();
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor.getState().copyStyle(project.shots[0].id);
    expect(useEditor.getState().past).toHaveLength(0);
    useEditor.getState().pasteStyle(project.shots[1].id, "typography");
    const pasted = structuredClone(useEditor.getState().project!.shots[1]);
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[1]).toEqual(project.shots[1]);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[1]).toEqual(pasted);
    useEditor.getState().close();
  });
});
