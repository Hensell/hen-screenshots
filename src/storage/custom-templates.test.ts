import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { createProject, createShot, type Asset } from "../core/model";
import { captureTemplate, appendTemplate } from "../core/custom-templates";
import { referencedAssetIds } from "../core/localization";
import { applyTemplate } from "../core/templates";
import { exportProject, importProject } from "./backup";
import {
  listCustomTemplates,
  loadCustomTemplate,
  saveCustomTemplate,
  deleteCustomTemplate,
} from "./custom-templates";
import { saveProject, loadProject, deleteProject } from "./repository";

const image: Asset = {
  id: "background",
  name: "art.png",
  mime: "image/png",
  width: 1,
  height: 1,
  blob: new Blob(["png"]),
};
afterEach(async () => {
  for (const item of await listCustomTemplates())
    await deleteCustomTemplate(item.id);
});
function template() {
  const source = createProject();
  source.shots = [createShot("private", 0)];
  applyTemplate(source, source.shots[0].id, "panorama", false);
  source.shots.forEach((shot) => {
    shot.backgroundImage = { assetId: image.id, fit: "contain", opacity: 0.6 };
  });
  return captureTemplate(source, source.shots[0].id, "Artwork", [image]);
}
describe("template storage and portability", () => {
  it("keeps template artwork separate from projects and does not break projects when deleting the template", async () => {
    const record = await saveCustomTemplate(template());
    expect((await listCustomTemplates())[0].name).toBe("Artwork");
    const loaded = await loadCustomTemplate(record.id);
    const target = createProject();
    const copy = appendTemplate(target, loaded, []);
    try {
      await saveProject(target, copy.assets, 0);
      await deleteCustomTemplate(record.id);
      await expect(loadCustomTemplate(record.id)).rejects.toThrow(/removed/);
      const reopened = await loadProject(target.id);
      expect(reopened.project.shots[0].backgroundImage).toEqual(
        copy.project.shots[0].backgroundImage,
      );
      expect(await reopened.assets[0].blob.text()).toBe("png");
      const blank = structuredClone(target);
      blank.shots.forEach((shot) => {
        delete shot.backgroundImage;
      });
      await saveProject(blank, copy.assets, 1);
      expect((await loadProject(target.id)).assets).toHaveLength(0);
    } finally {
      await deleteProject(target.id);
    }
  });
  it("round-trips template archives with validated image decoding and remaps a shared panorama background once", async () => {
    const source = template();
    const blob = await exportProject(
      source.project,
      source.assets,
      "hen-screenshots-template",
    );
    const decode = async () => [{ ...image, id: "new-image" }];
    const file = new File([blob], "art.hentemplate");
    const restored = await importProject(
      file,
      decode,
      "hen-screenshots-template",
    );
    expect(referencedAssetIds(restored.project)).toEqual(["new-image"]);
    expect(restored.project.shots[0].backgroundImage).toEqual({
      assetId: "new-image",
      fit: "contain",
      opacity: 0.6,
    });
    expect(restored.project.shots[0].backgroundImage).toEqual(
      restored.project.shots[1].backgroundImage,
    );
    await expect(importProject(file, decode)).rejects.toThrow();
    const projectFile = new File(
      [await exportProject(source.project, source.assets)],
      "art.henscreenshots",
    );
    await expect(
      importProject(projectFile, decode, "hen-screenshots-template"),
    ).rejects.toThrow();
    const backedUp = await importProject(projectFile, decode);
    expect(backedUp.project.shots[0].backgroundImage!.assetId).toBe(
      "new-image",
    );
  });
});
