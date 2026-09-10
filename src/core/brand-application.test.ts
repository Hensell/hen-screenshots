import { afterEach, describe, expect, it } from "vitest";
import {
  appliedBrand,
  applyBrandKit,
  brandFromSlide,
  brandStyle,
} from "./brand-application";
import { brandSnapshotKey, newBrandKit } from "./brand-kit";
import {
  createProject,
  createShot,
  migrateProject,
  resolveStyle,
  validateProject,
  type V5Project,
} from "./model";
import { applyTemplate } from "./templates";
import { useEditor } from "../editor/store";

function project() {
  const document = createProject("FrogHappy");
  document.shots = [createShot("screen-a", 0), createShot("screen-b", 1)];
  return document;
}
afterEach(() => useEditor.getState().close());

describe("reusable brand identities", () => {
  it("captures the effective palette and template font, without copying composition settings", () => {
    const document = project();
    applyTemplate(document, document.shots[0].id, "bloom");
    document.shots[0].style.accentColor = "#AABBCC";
    const kit = brandFromSlide(document, document.shots[0]);
    expect(kit.name).toBe("FrogHappy");
    expect(kit.colors.accent).toBe("#AABBCC");
    expect(kit.fonts.title).toBe("Fraunces");
    expect(kit).not.toHaveProperty("template");
    expect(kit).not.toHaveProperty("phone");
  });
  it("updates only the selected slide's identity and leaves content, positions and destination intact", () => {
    const document = project();
    document.shots[0].textOffsets = { title: { x: 93, y: -124 } };
    const before = structuredClone(document);
    const kit = newBrandKit();
    kit.fonts.title = "Fraunces";
    applyBrandKit(document, kit, document.shots[0].id);
    expect(document.style).toEqual(before.style);
    expect(document.shots[1]).toEqual(before.shots[1]);
    expect(document.exportProfile).toBe(before.exportProfile);
    expect(document.customSize).toEqual(before.customSize);
    expect(document.shots[0]).toEqual({
      ...before.shots[0],
      brand: brandSnapshotKey(kit),
      style: brandStyle(kit),
    });
    expect(() => validateProject(document)).not.toThrow();
  });
  it.each(["panorama", "daybreak", "tidal"] as const)(
    "applies to both halves of %s and preserves their independent captions",
    (template) => {
      const document = project();
      applyTemplate(document, document.shots[0].id, template);
      const before = structuredClone(document);
      const kit = newBrandKit();
      kit.fonts.body = "Fraunces";
      applyBrandKit(document, kit, document.shots[1].id);
      for (const index of [0, 1]) {
        expect(resolveStyle(document, document.shots[index])).toMatchObject(
          brandStyle(kit),
        );
        expect(document.shots[index].phone).toEqual(before.shots[index].phone);
        expect(document.shots[index].title).toBe(before.shots[index].title);
        expect(document.shots[index].style.template).toBe(
          before.shots[index].style.template,
        );
      }
      expect(document.shots[2]).toEqual(before.shots[2]);
      expect(() => validateProject(document)).not.toThrow();
    },
  );
  it("sets defaults for new slides when applying to a whole series", () => {
    const document = project(),
      kit = newBrandKit();
    document.shots[0].style.background = "#123456";
    applyBrandKit(document, kit, undefined, true);
    document.shots.push(createShot("new-image", 2));
    for (const shot of document.shots) {
      expect(resolveStyle(document, shot)).toMatchObject(brandStyle(kit));
      expect(appliedBrand(document, shot)).toEqual(kit);
    }
  });
  it("retains older applied revisions when only another slide is updated", () => {
    const document = project(),
      kit = newBrandKit();
    applyBrandKit(document, kit, undefined, true);
    kit.colors.background = "#123456";
    kit.revision++;
    expect(
      appliedBrand(document, document.shots[0])!.colors.background,
    ).not.toBe(kit.colors.background);
    applyBrandKit(document, kit, document.shots[1].id);
    expect(appliedBrand(document, document.shots[0])!.revision).toBe(1);
    expect(appliedBrand(document, document.shots[1])!.revision).toBe(2);
    expect(() => validateProject(document)).not.toThrow();
  });
  it("bounds embedded copies by pruning revisions that are no longer applied", () => {
    const document = project(),
      kit = newBrandKit();
    for (let revision = 1; revision < 70; revision++) {
      kit.revision = revision;
      applyBrandKit(document, kit, document.shots[0].id);
    }
    expect(Object.keys(document.brands!)).toHaveLength(1);
    expect(() => validateProject(document)).not.toThrow();
  });
  it("undoes and redoes an entire brand application together with its portable copy", () => {
    const document = project(),
      kit = newBrandKit();
    useEditor.getState().open({ project: document, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) => applyBrandKit(draft, kit, undefined, true));
    const applied = structuredClone(useEditor.getState().project!);
    useEditor.getState().undo();
    expect(useEditor.getState().project).toEqual({
      ...document,
      updatedAt: expect.any(Number),
    });
    useEditor.getState().redo();
    expect(useEditor.getState().project).toEqual({
      ...applied,
      updatedAt: expect.any(Number),
    });
  });
  it("migrates schema 5 without introducing font overrides or changing authored scenes", () => {
    const old: V5Project = { ...project(), schemaVersion: 5 };
    old.shots[0].textOffsets = { subtitle: { x: 38, y: -91 } };
    const before = structuredClone(old);
    expect(migrateProject(old)).toEqual({ ...old, schemaVersion: 10 });
    expect(old).toEqual(before);
  });
  it("rejects missing brand references, mismatched snapshot keys and unknown fonts", () => {
    const document = project(),
      kit = newBrandKit();
    applyBrandKit(document, kit, undefined, true);
    const missing = structuredClone(document);
    delete missing.brands;
    expect(() => validateProject(missing)).toThrow();
    const mismatched = structuredClone(document);
    mismatched.brands![mismatched.brand!].revision++;
    expect(() => validateProject(mismatched)).toThrow();
    expect(() =>
      validateProject({
        ...document,
        style: { ...document.style, titleFont: "Comic Sans" },
      }),
    ).toThrow();
    expect(() => validateProject({ ...document, schemaVersion: 5 })).toThrow();
  });
});
