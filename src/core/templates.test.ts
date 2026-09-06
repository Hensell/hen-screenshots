import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../storage/repository", () => ({ saveProject: vi.fn(async () => 1) }));
import { createProject, createShot, resolveStyle } from "./model";
import {
  applyTemplate,
  changeExportProfile,
  changeCustomSize,
  getTemplate,
  templatePreview,
} from "./templates";
import { useEditor } from "../editor/store";

function fixture() {
  const project = createProject("My own app");
  project.shots = [
    createShot("home", 0),
    createShot("stats", 1),
    createShot("focus", 2),
  ];
  project.shots[0].style = {
    device: "ios",
    frame: false,
    camera: true,
    fit: "cover",
    background: "#123456",
  };
  project.shots[1].style = {
    template: "editorial",
    background: "#654321",
    textColor: "#AABBCC",
  };
  return project;
}
beforeEach(() => useEditor.getState().close());
describe("template application", () => {
  it("changes one composition while retaining its identity, content, source and device settings", () => {
    const project = fixture();
    const original = structuredClone(project);
    applyTemplate(project, project.shots[0].id, "tilt");
    const shot = project.shots[0];
    expect(project.style).toEqual(original.style);
    expect(project.shots.slice(1)).toEqual(original.shots.slice(1));
    expect({
      ...shot,
      style: original.shots[0].style,
      phone: original.shots[0].phone,
    }).toEqual(original.shots[0]);
    expect(shot.phone).toEqual(getTemplate("tilt").phone);
    expect(resolveStyle(project, shot)).toMatchObject({
      template: "tilt",
      device: "ios",
      frame: false,
      camera: true,
      fit: "cover",
    });
  });

  it("applies a whole series as one reversible edit, including layout and inherited styles", () => {
    const project = fixture();
    const original = structuredClone(project);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) =>
        applyTemplate(draft, draft.shots[0].id, "spotlight", true),
      );
    const applied = useEditor.getState().project!;
    expect(applied.style.template).toBe("spotlight");
    expect(
      applied.shots.map((shot) => resolveStyle(applied, shot).template),
    ).toEqual(["spotlight", "spotlight", "spotlight"]);
    expect(applied.shots.map((shot) => shot.phone)).toEqual(
      Array(3).fill(getTemplate("spotlight").phone),
    );
    expect(
      applied.shots.map((shot) => resolveStyle(applied, shot).device),
    ).toEqual(["ios", "android", "android"]);
    expect(
      applied.shots.map(({ id, assetId, title, subtitle }) => ({
        id,
        assetId,
        title,
        subtitle,
      })),
    ).toEqual(
      original.shots.map(({ id, assetId, title, subtitle }) => ({
        id,
        assetId,
        title,
        subtitle,
      })),
    );
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: original.updatedAt,
    }).toEqual(original);
    useEditor.getState().redo();
    expect({
      ...useEditor.getState().project,
      updatedAt: applied.updatedAt,
    }).toEqual(applied);
  });

  it("keeps each screenshot's effective colors while applying a series template", () => {
    const project = fixture();
    const colors = project.shots.map((shot) => {
      const { background, backgroundEnd, textColor, accentColor } =
        resolveStyle(project, shot);
      return { background, backgroundEnd, textColor, accentColor };
    });
    applyTemplate(project, project.shots[0].id, "editorial", true, true);
    project.shots.forEach((shot, index) =>
      expect(resolveStyle(project, shot)).toMatchObject({
        ...colors[index],
        template: "editorial",
      }),
    );
  });

  it("previews the same style and position that application will produce without mutating the document", () => {
    for (const keepColors of [true, false]) {
      const project = fixture();
      const before = structuredClone(project);
      const preview = templatePreview(
        project,
        project.shots[0],
        "spotlight",
        keepColors,
      );
      expect(project).toEqual(before);
      applyTemplate(
        project,
        project.shots[0].id,
        "spotlight",
        false,
        keepColors,
      );
      expect(preview.phone).toEqual(project.shots[0].phone);
      expect(resolveStyle(project, preview)).toEqual(
        resolveStyle(project, project.shots[0]),
      );
    }
  });

  it("undoes a destination change and every reflow together", () => {
    const project = fixture();
    const original = structuredClone(project);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) => changeExportProfile(draft, "apple-ipad13-landscape"));
    expect(useEditor.getState().past).toHaveLength(1);
    expect(useEditor.getState().project!.exportProfile).toBe(
      "apple-ipad13-landscape",
    );
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: original.updatedAt,
    }).toEqual(original);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.exportProfile).toBe(
      "apple-ipad13-landscape",
    );
  });

  it("commits a complete custom size and its reflow as one undo step", () => {
    const project = fixture();
    project.exportProfile = "portfolio-custom";
    const original = structuredClone(project);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) => changeCustomSize(draft, { width: 1400, height: 1000 }));
    expect(useEditor.getState().past).toHaveLength(1);
    expect(useEditor.getState().project!.customSize).toEqual({
      width: 1400,
      height: 1000,
    });
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: original.updatedAt,
    }).toEqual(original);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.customSize).toEqual({
      width: 1400,
      height: 1000,
    });
  });

  it("ignores a stale selected screenshot rather than restyling another project", () => {
    const project = fixture();
    const before = structuredClone(project);
    applyTemplate(project, "missing", "tilt", true);
    expect(project).toEqual(before);
  });
});
