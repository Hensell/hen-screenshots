import { SCHEMA_VERSION } from "./model";
import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  migrateProject,
  validateProject,
  type Asset,
  type V8Project,
} from "./model";
import {
  addOverlay,
  overlayPlacement,
  overlayUploadBytes,
  removeOverlay,
  reorderOverlay,
  resizeOverlay,
  sceneAssetIds,
  setOverlayPlacement,
} from "./overlays";
import { applyTemplate } from "./templates";
import { duplicateUnit } from "./panorama";
import {
  addLanguage,
  localizedProject,
  localContent,
  referencedAssetIds,
} from "./localization";
import { useEditor } from "../editor/store";

const image = (id = "logo"): Asset => ({
  id,
  name: `${id}.png`,
  mime: "image/png",
  width: 400,
  height: 200,
  blob: new Blob([id]),
});
const fixture = () => {
  const p = createProject("Overlays");
  p.shots = [createShot("capture", 0)];
  return p;
};

describe("extra image layers", () => {
  it("budgets every language and releases replacement bytes only when no other reference remains", () => {
    const p = fixture(),
      s = p.shots[0];
    addLanguage(p, "en", "es");
    localContent(s, "es").assetId = "capture-es";
    const mb = 1024 * 1024;
    const assets = [
      ["capture", 70],
      ["capture-es", 20],
      ["logo", 20],
      ["unused", 99],
    ].map(([id, size]) => ({
      ...image(String(id)),
      blob: { size: Number(size) * mb } as Blob,
    }));
    const overlay = addOverlay(p, s, assets[2]);
    const before = structuredClone(p);
    expect(
      overlayUploadBytes(p, assets, [{ size: 15 * mb }], { shotId: s.id }),
    ).toBe(125 * mb);
    const replacement = { shotId: s.id, replaceId: overlay.id };
    expect(
      overlayUploadBytes(p, assets, [{ size: 19 * mb }], replacement),
    ).toBe(109 * mb);
    expect(p).toEqual(before);
    duplicateUnit(p, s.id);
    expect(
      overlayUploadBytes(p, assets, [{ size: 19 * mb }], replacement),
    ).toBe(129 * mb);
  });
  it("preserves the original screenshot and captions, keeps aspect ratio and resizes around its center", () => {
    const p = fixture(),
      s = p.shots[0],
      before = structuredClone(s);
    const overlay = addOverlay(p, s, image());
    setOverlayPlacement(overlay, resizeOverlay(overlay, 600));
    expect(overlay.width / overlay.height).toBe(2);
    expect(overlay.x + overlay.width / 2).toBe(888);
    expect(overlay.y + overlay.height / 2).toBe(132);
    expect({ ...s, overlays: undefined }).toEqual({
      ...before,
      overlays: undefined,
    });
    setOverlayPlacement(overlay, { x: -99999, y: 99999, rotation: Infinity });
    expect(overlay.x).toBe(-1080);
    expect(overlay.y).toBe(4096);
    expect(overlay.rotation).toBe(0);
    Object.assign(overlay, overlayPlacement(p, overlay.width / overlay.height));
    expect(overlay.width).toBe(240);
    validateProject(p);
  });
  it("keeps layers through template changes, independent duplication, localized views and undo/redo", () => {
    const p = fixture(),
      s = p.shots[0];
    addOverlay(p, s, image());
    const original = structuredClone(s.overlays);
    applyTemplate(p, s.id, "ecosystem");
    expect(s.overlays).toEqual(original);
    addLanguage(p, "en", "es");
    expect(localizedProject(p, "es").shots[0].overlays).toEqual(original);
    expect(referencedAssetIds(p)).toContain("logo");
    duplicateUnit(p, s.id);
    p.shots[1].overlays![0].x = 12;
    expect(s.overlays![0].x).not.toBe(12);
    useEditor.getState().open({ project: p, assets: [image()], revision: 1 });
    useEditor
      .getState()
      .edit((draft) => removeOverlay(draft.shots[0], original![0].id));
    expect(useEditor.getState().project!.shots[0].overlays).toBeUndefined();
    useEditor.getState().undo();
    expect(useEditor.getState().project!.shots[0].overlays).toEqual(original);
    useEditor.getState().redo();
    expect(useEditor.getState().project!.shots[0].overlays).toBeUndefined();
    useEditor.getState().close();
    validateProject(p);
  });
  it("keeps per-slide ownership while both panorama crops request every overlay asset", () => {
    const p = fixture();
    addOverlay(p, p.shots[0], image());
    applyTemplate(p, p.shots[0].id, "panorama");
    expect(p.shots[0].overlays).toHaveLength(1);
    expect(p.shots[1].overlays).toBeUndefined();
    addOverlay(p, p.shots[1], image("award"));
    for (const s of p.shots)
      expect(new Set(sceneAssetIds(p, s))).toEqual(
        new Set(["capture", "logo", "award"]),
      );
    applyTemplate(p, p.shots[0].id, "daybreak");
    expect(p.shots.map((s) => s.overlays![0].assetId)).toEqual([
      "logo",
      "award",
    ]);
    validateProject(p);
  });
  it("enforces capacity, orders safely and releases removed image references", () => {
    const p = fixture(),
      s = p.shots[0];
    const first = addOverlay(p, s, image());
    for (let i = 1; i < 8; i++) addOverlay(p, s, image(`award-${i}`));
    expect(() => addOverlay(p, s, image())).toThrow("8 extra images");
    reorderOverlay(s, first.id, -1);
    expect(s.overlays![0].id).toBe(first.id);
    reorderOverlay(s, first.id, 1);
    expect(s.overlays![1].id).toBe(first.id);
    removeOverlay(s, first.id);
    expect(referencedAssetIds(p)).not.toContain("logo");
    validateProject(p);
  });
  it("migrates version 8 without changing its content or source", () => {
    const old: V8Project = { ...fixture(), schemaVersion: 8 },
      before = structuredClone(old);
    const migrated = migrateProject(old);
    expect(migrated).toEqual({ ...before, schemaVersion: SCHEMA_VERSION });
    expect(old).toEqual(before);
    validateProject(migrated);
  });
  it("rejects corrupt image layers before they can enter storage", () => {
    const p = fixture();
    addOverlay(p, p.shots[0], image());
    for (const patch of [
      { width: 0 },
      { height: NaN },
      { rotation: 181 },
      { assetId: "" },
      { x: 2161 },
      { extra: true },
    ]) {
      const bad = structuredClone(p);
      Object.assign(bad.shots[0].overlays![0], patch);
      expect(() => validateProject(bad)).toThrow();
    }
    p.shots[0].overlays!.push(structuredClone(p.shots[0].overlays![0]));
    expect(() => validateProject(p)).toThrow();
  });
});
