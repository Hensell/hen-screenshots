import { afterEach, describe, expect, it } from "vitest";
import {
  canvasOrientation,
  customSizeForOrientation,
  portfolioFormatForProfile,
  portfolioFormats,
  profileForOrientation,
  profileForPortfolioFormat,
  profileForSlot,
  profileForStore,
  projectPurpose,
  storeSlotForProfile,
  storeSlots,
} from "./canvas-formats";
import {
  exportProfiles,
  getExportProfile,
  resolveExportProfile,
  validateDimensions,
} from "./export-profiles";
import { createProject, createShot, validateProject } from "./model";
import { changeCustomSize, changeExportProfile } from "./templates";
import { useEditor } from "../editor/store";

afterEach(() => useEditor.getState().close());

describe("separate canvas workflows", () => {
  it("assigns every profile to exactly one purpose and one format family", () => {
    for (const profile of exportProfiles) {
      const purpose = projectPurpose({ exportProfile: profile.id });
      const slot = storeSlotForProfile(profile.id);
      const format = portfolioFormatForProfile(profile.id);
      expect(purpose).toBe(
        profile.category === "banner"
          ? "banners"
          : profile.store === "presentation"
            ? "portfolio"
            : "stores",
      );
      expect(Boolean(slot)).toBe(purpose === "stores");
      expect(Boolean(format)).toBe(purpose === "portfolio");
      expect(
        storeSlots.filter((item) =>
          Object.values(item.profiles).includes(profile.id),
        ),
      ).toHaveLength(purpose === "stores" ? 1 : 0);
      expect(
        portfolioFormats.filter(
          (item) =>
            item.defaultProfile === profile.id ||
            Object.values(item.profiles).includes(profile.id),
        ),
      ).toHaveLength(purpose === "portfolio" ? 1 : 0);
    }
  });

  it("changes orientation inside the same exact store device slot", () => {
    for (const slot of storeSlots) {
      for (const orientation of ["portrait", "landscape"] as const) {
        const id = profileForSlot(slot.id, orientation);
        const profile = getExportProfile(id);
        expect(storeSlotForProfile(id)?.id).toBe(slot.id);
        expect(profile.store).toBe(slot.store);
        expect(() =>
          validateDimensions(profile, profile.width, profile.height),
        ).not.toThrow();
        expect(profileForOrientation(id, orientation)).toBe(
          slot.profiles[orientation],
        );
        if (
          slot.profiles.portrait &&
          slot.profiles.landscape &&
          slot.id !== "play-auto"
        ) {
          const opposite = getExportProfile(
            profileForSlot(
              slot.id,
              orientation === "portrait" ? "landscape" : "portrait",
            ),
          );
          expect([profile.width, profile.height]).toEqual([
            opposite.height,
            opposite.width,
          ]);
        }
      }
    }
    expect(profileForOrientation("apple-mac", "portrait")).toBeUndefined();
    expect(
      profileForOrientation("play-chromebook", "portrait"),
    ).toBeUndefined();
    expect(profileForSlot("apple-mac", "portrait")).toBe("apple-mac");
  });

  it("preserves orientation and category when switching stores", () => {
    expect(profileForStore("play-phone-landscape", "apple")).toBe(
      "apple-iphone69-landscape",
    );
    expect(profileForStore("apple-iphone65-portrait", "google")).toBe(
      "play-phone-portrait",
    );
    expect(profileForStore("play-tablet10-landscape", "apple")).toBe(
      "apple-ipad13-landscape",
    );
    expect(profileForStore("apple-ipad13-portrait", "google")).toBe(
      "play-tablet7-portrait",
    );
    expect(profileForStore("apple-mac", "google")).toBe("play-chromebook");
    expect(profileForStore("play-chromebook", "apple")).toBe("apple-mac");
    expect(profileForStore("play-tablet10-landscape", "google")).toBe(
      "play-tablet10-landscape",
    );
    expect(() => profileForStore("portfolio-card", "apple")).toThrow(
      /App stores project/,
    );
  });

  it("rotates portfolio shape families without changing their proportions", () => {
    for (const format of portfolioFormats.filter(
      (item) => item.id !== "custom" && item.id !== "square",
    )) {
      const portrait = getExportProfile(
        profileForPortfolioFormat(format.id, "portrait"),
      );
      const landscape = getExportProfile(
        profileForPortfolioFormat(format.id, "landscape"),
      );
      expect([portrait.width, portrait.height]).toEqual([
        landscape.height,
        landscape.width,
      ]);
      expect(portrait.width).toBeLessThan(portrait.height);
      expect(landscape.width).toBeGreaterThan(landscape.height);
      expect(profileForOrientation(portrait.id, "landscape")).toBe(
        landscape.id,
      );
      expect(profileForOrientation(landscape.id, "portrait")).toBe(portrait.id);
      expect(profileForPortfolioFormat(format.id, "square")).toBe(
        format.defaultProfile,
      );
      expect(portrait.store).toBe("presentation");
      expect(landscape.store).toBe("presentation");
    }
    expect(profileForPortfolioFormat("square", "landscape")).toBe(
      "portfolio-square",
    );
    expect(
      profileForOrientation("portfolio-square", "portrait"),
    ).toBeUndefined();
    expect(profileForPortfolioFormat("custom", "portrait")).toBe(
      "portfolio-custom",
    );
    expect(() => profileForPortfolioFormat("play-phone", "portrait")).toThrow(
      /portfolio format/,
    );
    expect(() => profileForSlot("card", "landscape")).toThrow(
      /device category/,
    );
  });

  it("resolves custom orientation from actual dimensions and swaps only the committed sides", () => {
    const project = createProject();
    project.exportProfile = "portfolio-custom";
    project.customSize = { width: 1537, height: 1103 };
    expect(canvasOrientation(project)).toBe("landscape");
    expect(customSizeForOrientation(project.customSize, "portrait")).toEqual({
      width: 1103,
      height: 1537,
    });
    expect(project.customSize).toEqual({ width: 1537, height: 1103 });
    expect(customSizeForOrientation(project.customSize, "landscape")).toEqual(
      project.customSize,
    );
    project.customSize = { width: 1024, height: 1024 };
    expect(canvasOrientation(project)).toBe("square");
    expect(customSizeForOrientation(project.customSize, "portrait")).toEqual(
      project.customSize,
    );
    project.exportProfile = "apple-iphone69-portrait";
    expect(canvasOrientation(project)).toBe("portrait");
  });

  it("undoes a preset rotation and all slide reflow in a single edit", () => {
    const project = createProject();
    project.exportProfile = "portfolio-card";
    project.shots = [createShot("one", 0), createShot("two", 1)];
    const original = structuredClone(project);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) =>
        changeExportProfile(
          draft,
          profileForOrientation(draft.exportProfile, "portrait")!,
        ),
      );
    const changed = structuredClone(useEditor.getState().project!);
    expect(changed.exportProfile).toBe("portfolio-card-portrait");
    expect(changed.shots.map((shot) => shot.phone)).not.toEqual(
      original.shots.map((shot) => shot.phone),
    );
    expect(() => validateProject(changed)).not.toThrow();
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: original.updatedAt,
    }).toEqual(original);
    useEditor.getState().redo();
    expect({
      ...useEditor.getState().project,
      updatedAt: changed.updatedAt,
    }).toEqual(changed);
  });

  it("undoes a custom rotation together with its dimensions and slide reflow", () => {
    const project = createProject();
    project.exportProfile = "portfolio-custom";
    project.customSize = { width: 1537, height: 1103 };
    project.shots = [createShot("one", 0), createShot("two", 1)];
    const original = structuredClone(project);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    useEditor
      .getState()
      .edit((draft) =>
        changeCustomSize(
          draft,
          customSizeForOrientation(draft.customSize, "portrait"),
        ),
      );
    const changed = structuredClone(useEditor.getState().project!);
    expect(resolveExportProfile(changed)).toMatchObject({
      width: 1103,
      height: 1537,
    });
    expect(changed.shots.map((shot) => shot.phone)).not.toEqual(
      original.shots.map((shot) => shot.phone),
    );
    expect(() => validateProject(changed)).not.toThrow();
    expect(useEditor.getState().past).toHaveLength(1);
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: original.updatedAt,
    }).toEqual(original);
    useEditor.getState().redo();
    expect({
      ...useEditor.getState().project,
      updatedAt: changed.updatedAt,
    }).toEqual(changed);
  });
});

describe("additional store slots", () => {
  it("uses Automotive's distinct portrait and landscape sizes and Wear's square slot", () => {
    expect(
      getExportProfile(profileForSlot("play-auto", "portrait")),
    ).toMatchObject({ width: 800, height: 1280 });
    expect(
      getExportProfile(profileForSlot("play-auto", "landscape")),
    ).toMatchObject({ width: 1024, height: 768 });
    expect(profileForSlot("play-wear", "landscape")).toBe("play-wear");
    expect(profileForStore("play-wear", "apple")).toBe("apple-watch-422");
    expect(profileForStore("play-auto-portrait", "apple")).toBe(
      "apple-iphone69-portrait",
    );
  });
});
