import { afterEach, describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
} from "./model";
import { resizeDevice, setDevicePlacement } from "./device-placement";
import { deviceGeometry } from "../rendering/geometry";
import { applyTemplate } from "./templates";
import { editLinkedShots } from "./panorama";
import { useEditor } from "../editor/store";
import { addLanguage, writeText } from "./localization";

afterEach(() => useEditor.getState().close());

describe("device resizing", () => {
  it.each([
    "android",
    "ios",
    "ipad",
    "android-tablet",
    "card",
    "monitor",
    "laptop",
  ] as const)(
    "preserves the center and proportions of %s in either orientation, with or without a frame",
    (device) => {
      for (const orientation of ["portrait", "landscape"] as const)
        for (const frame of [true, false]) {
          const project = createProject();
          const shot = createShot("source", 0);
          project.shots = [shot];
          shot.phone = { x: 400, y: 300, width: 560, rotation: 17 };
          shot.style = { device, deviceOrientation: orientation, frame };
          const original = structuredClone(shot);
          const style = resolveStyle(project, shot);
          const before = deviceGeometry(
            device,
            shot.phone.width,
            frame,
            orientation,
          );
          resizeDevice(shot, style, 840);
          const after = deviceGeometry(
            device,
            shot.phone.width,
            frame,
            orientation,
          );
          expect(shot.phone.x + after.width / 2).toBeCloseTo(
            original.phone.x + before.width / 2,
          );
          expect(shot.phone.y + after.height / 2).toBeCloseTo(
            original.phone.y + before.height / 2,
          );
          expect(after.width / after.height).toBeCloseTo(
            before.width / before.height,
          );
          expect({ ...shot, phone: original.phone }).toEqual(original);
          expect(shot.phone.rotation).toBe(17);
          resizeDevice(shot, style, original.phone.width);
          expect(shot.phone.x).toBeCloseTo(original.phone.x);
          expect(shot.phone.y).toBeCloseTo(original.phone.y);
          expect(() => validateProject(project)).not.toThrow();
        }
    },
  );
  it("rejects nonfinite input and bounds persisted placements", () => {
    const shot = createShot("source", 0);
    const before = structuredClone(shot.phone);
    setDevicePlacement(shot, { x: NaN, y: 0, width: 500 });
    expect(shot.phone).toEqual(before);
    resizeDevice(shot, createProject().style, Infinity);
    expect(shot.phone).toEqual(before);
    setDevicePlacement(shot, { x: -3000, y: 6000, width: 4000 });
    expect(shot.phone).toMatchObject({ x: -1080, y: 4096, width: 2160 });
    setDevicePlacement(shot, { x: 0, y: 0, width: -10 });
    expect(shot.phone.width).toBe(32);
  });
  it("commits a panorama resize once, preserves localized text, and undoes both halves together", () => {
    const project = createProject();
    project.shots = [createShot("image", 0)];
    applyTemplate(project, project.shots[0].id, "orbit");
    addLanguage(project, "en", "es");
    writeText(project.shots[1], "es", "title", "Hola");
    writeText(project.shots[1], "es", "subtitle", "Otro día");
    const original = structuredClone(project);
    const rightId = project.shots[1].id;
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) =>
        editLinkedShots(draft, rightId, (shot) =>
          setDevicePlacement(shot, { x: 700, y: 350, width: 850 }),
        ),
      );
    const resized = useEditor.getState().project!;
    expect(resized.shots[0].phone).toEqual(resized.shots[1].phone);
    expect(resized.shots[1].translations).toEqual(
      original.shots[1].translations,
    );
    expect(useEditor.getState().past).toHaveLength(1);
    expect(() =>
      validateProject(JSON.parse(JSON.stringify(resized))),
    ).not.toThrow();
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots).toEqual(original.shots);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots).toEqual(resized.shots);
  });
});
