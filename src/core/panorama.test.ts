import { panoramaFamilies, type PanoramaId } from "./panorama-families";
import { afterEach, describe, expect, it, vi } from "vitest";
import { unzipSync } from "fflate";
import {
  createProject,
  createShot,
  resolveStyle,
  validateProject,
  type Asset,
  type Project,
  type Shot,
  type DeviceFamily,
} from "./model";
import {
  canonicalCanvas,
  exportProfiles,
  type ExportProfileId,
} from "./export-profiles";
import { deviceGeometry } from "../rendering/geometry";
import {
  applyPanorama,
  duplicateUnit,
  editLinkedShots,
  linkedShots,
  moveUnit,
  panoramaPair,
  panoramaPreview,
  removeUnit,
  shotCapacity,
} from "./panorama";
import {
  applyTemplate,
  changeCustomSize,
  changeExportProfile,
  resetComposition,
  templateLayout,
} from "./templates";
import { useEditor } from "../editor/store";
import { exportProject, importProject } from "../storage/backup";

afterEach(() => {
  useEditor.getState().close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function projectWithShots(
  count = 3,
  profile: ExportProfileId = "play-phone-portrait",
) {
  const project = createProject("Panorama study");
  project.exportProfile = profile;
  project.shots = Array.from({ length: count }, (_, index) =>
    createShot(`asset-${index}`, index),
  );
  for (const shot of project.shots) resetComposition(project, shot);
  return project;
}

function assertPair(
  project: Project,
  id: string,
  family: PanoramaId = "panorama",
): [Shot, Shot] {
  const pair = panoramaPair(project, id);
  expect(pair).not.toBeNull();
  const [left, right] = pair!;
  const leftStyle = resolveStyle(project, left);
  const rightStyle = resolveStyle(project, right);
  expect(leftStyle.template).toBe(family);
  expect(rightStyle.template).toBe(panoramaFamilies[family]);
  expect({ ...leftStyle, template: "same" }).toEqual({
    ...rightStyle,
    template: "same",
  });
  expect(left.assetId).toBe(right.assetId);
  expect(left.phone).toEqual(right.phone);
  expect(project.shots.indexOf(right)).toBe(project.shots.indexOf(left) + 1);
  expect(() => validateProject(project)).not.toThrow();
  return pair!;
}

describe("panorama creation and editing", () => {
  it.each([false, true])(
    "matches its non-mutating two-slide preview (keepColors=%s)",
    (keepColors) => {
      const project = projectWithShots();
      const shot = project.shots[1];
      shot.style = {
        background: "#123456",
        backgroundEnd: "#654321",
        textColor: "#ABCDEF",
        accentColor: "#FEDCBA",
        device: "laptop",
        deviceOrientation: "landscape",
      };
      const before = structuredClone(project);
      const preview = panoramaPreview(project, shot, keepColors);
      expect(project).toEqual(before);
      expect(preview[0].id).toBe(shot.id);
      expect(preview[1].id).not.toBe(shot.id);
      applyPanorama(project, shot.id, keepColors);
      const actual = assertPair(project, shot.id);
      expect(actual[0]).toEqual(preview[0]);
      expect({ ...actual[1], id: preview[1].id }).toEqual(preview[1]);
      expect(actual[1].id).not.toBe(preview[1].id);
      expect(project.shots).toHaveLength(before.shots.length + 1);
      expect(project.shots[0]).toEqual(before.shots[0]);
      expect(project.shots[3]).toEqual(before.shots[2]);
      expect(actual[0].title).toBe(shot.title);
      expect(actual[1].title).toBe("A closer look.");
      expect(actual[1].subtitle).toBe("");
      if (keepColors)
        for (const key of [
          "background",
          "backgroundEnd",
          "textColor",
          "accentColor",
        ] as const)
          expect(resolveStyle(project, actual[0])[key]).toBe(shot.style[key]);
    },
  );

  it("reapplies from either half without replacing IDs, text or other screenshots", () => {
    const project = projectWithShots();
    applyPanorama(project, project.shots[1].id);
    const pair = assertPair(project, project.shots[1].id);
    pair[0].title = "The whole picture";
    pair[1].title = "The finer details";
    pair[1].subtitle = "A second thought";
    const ids = project.shots.map((shot) => shot.id);
    const before = structuredClone(project);
    const preview = panoramaPreview(project, pair[1], true);
    applyPanorama(project, pair[1].id, true);
    expect(project.shots.map((shot) => shot.id)).toEqual(ids);
    expect(assertPair(project, pair[1].id)).toEqual(preview);
    expect(project.shots.map((shot) => [shot.title, shot.subtitle])).toEqual(
      before.shots.map((shot) => [shot.title, shot.subtitle]),
    );
  });

  it("shares source, style and placement while keeping text independent", () => {
    const project = projectWithShots();
    applyPanorama(project, project.shots[1].id);
    const pair = assertPair(project, project.shots[1].id);
    editLinkedShots(project, pair[1].id, (shot) => {
      shot.assetId = "replacement";
      shot.style.background = "#224466";
      shot.style.fit = "cover";
      shot.phone = { ...shot.phone, x: shot.phone.x + 20, rotation: 3 };
    });
    pair[1].title = "Only the second slide";
    pair[1].subtitle = "A separate caption";
    expect(pair[0].title).not.toBe(pair[1].title);
    expect(pair[0].subtitle).not.toBe(pair[1].subtitle);
    expect(assertPair(project, pair[0].id)).toEqual(pair);
    expect(linkedShots(project, pair[1].id)).toEqual(pair);
    expect(project.shots[0].assetId).toBe("asset-0");
    expect(linkedShots(project, project.shots[0].id)).toEqual([
      project.shots[0],
    ]);
    expect(linkedShots(project, "missing")).toEqual([]);
  });

  it.each(
    exportProfiles
      .filter((item) => item.category !== "banner" && item.id !== "play-wear")
      .map((profile) => profile.id),
  )("keeps one shared scene when reflowing to %s", (profile) => {
    const project = projectWithShots(1);
    applyPanorama(project, project.shots[0].id);
    changeExportProfile(project, profile);
    const pair = assertPair(project, project.shots[0].id);
    const left = templateLayout(project, resolveStyle(project, pair[0]));
    const right = templateLayout(project, resolveStyle(project, pair[1]));
    expect(left.phone).toEqual(right.phone);
    expect(left.title.x).not.toBe(right.title.x);
    expect(pair[0].phone).toEqual(left.phone);
  });
});

describe("panorama document invariants", () => {
  const mutations: [string, (project: Project) => void][] = [
    ["orphaned left half", (project) => project.shots.pop()],
    ["orphaned right half", (project) => project.shots.shift()],
    ["reversed roles", (project) => project.shots.reverse()],
    [
      "ordinary screenshot between halves",
      (project) => project.shots.splice(1, 0, createShot("other", 0)),
    ],
    [
      "different source",
      (project) => {
        project.shots[1].assetId = "other";
      },
    ],
    [
      "different color",
      (project) => {
        project.shots[1].style.background = "#FFFFFF";
      },
    ],
    [
      "different frame",
      (project) => {
        project.shots[1].style.device = "ipad";
      },
    ],
    [
      "different fit",
      (project) => {
        project.shots[1].style.fit = "cover";
      },
    ],
    [
      "different position",
      (project) => {
        project.shots[1].phone.x++;
      },
    ],
    [
      "different size",
      (project) => {
        project.shots[1].phone.width++;
      },
    ],
    [
      "different rotation",
      (project) => {
        project.shots[1].phone.rotation++;
      },
    ],
    [
      "global panorama template",
      (project) => {
        project.style.template = "panorama";
      },
    ],
  ];
  it.each(mutations)("rejects %s", (_, mutate) => {
    const project = projectWithShots(1);
    applyPanorama(project, project.shots[0].id);
    mutate(project);
    expect(() => validateProject(project)).toThrow();
  });
});

describe("panorama spread geometry", () => {
  it.each(Object.keys(panoramaFamilies) as PanoramaId[])(
    "keeps %s devices within the spread across profiles and custom extremes",
    (family) => {
      const scenarios: {
        profile: ExportProfileId;
        custom?: { width: number; height: number };
      }[] = [
        ...exportProfiles
          .filter(
            (item) => item.category !== "banner" && item.id !== "play-wear",
          )
          .map((profile) => ({ profile: profile.id })),
        ...[
          { width: 4096, height: 1024 },
          { width: 1024, height: 4096 },
          { width: 256, height: 256 },
          { width: 4096, height: 4096 },
          { width: 1537, height: 1103 },
        ].map((custom) => ({ profile: "portfolio-custom" as const, custom })),
      ];
      for (const scenario of scenarios)
        for (const device of [
          "android",
          "ios",
          "ipad",
          "android-tablet",
          "monitor",
          "laptop",
          "card",
        ] as DeviceFamily[])
          for (const deviceOrientation of ["portrait", "landscape"] as const)
            for (const frame of [true, false]) {
              const project = projectWithShots(1, scenario.profile);
              if (scenario.custom) project.customSize = scenario.custom;
              Object.assign(project.style, {
                device,
                deviceOrientation,
                frame,
              });
              applyPanorama(project, project.shots[0].id, false, family);
              const pair = assertPair(project, project.shots[0].id, family);
              const { height } = canonicalCanvas(project);
              const phone = pair[0].phone;
              const geometry = deviceGeometry(
                device,
                phone.width,
                frame,
                deviceOrientation,
              );
              const radians = (Math.abs(phone.rotation) * Math.PI) / 180;
              const boundWidth =
                Math.cos(radians) * geometry.width +
                Math.sin(radians) * geometry.height;
              const boundHeight =
                Math.sin(radians) * geometry.width +
                Math.cos(radians) * geometry.height;
              const centerX = phone.x + geometry.width / 2;
              const centerY = phone.y + geometry.height / 2;
              expect(centerX - boundWidth / 2).toBeGreaterThanOrEqual(0);
              expect(centerX + boundWidth / 2).toBeLessThanOrEqual(2160);
              expect(centerY - boundHeight / 2).toBeGreaterThanOrEqual(0);
              expect(centerY + boundHeight / 2).toBeLessThanOrEqual(height);
              // The same device crosses the join, so both output slides contain it.
              expect(centerX - boundWidth / 2).toBeLessThan(1080);
              expect(centerX + boundWidth / 2).toBeGreaterThan(1080);
              for (const shot of pair) {
                const layout = templateLayout(
                  project,
                  resolveStyle(project, shot),
                );
                for (const text of [layout.title, layout.subtitle]) {
                  expect(text.x).toBeGreaterThanOrEqual(0);
                  expect(text.x + text.width).toBeLessThanOrEqual(1080);
                  expect(text.y).toBeGreaterThanOrEqual(0);
                  expect(text.y + text.height).toBeLessThanOrEqual(height);
                  if (family === "moonlight") {
                    // Keep default captions clear of the tilted device on both halves.
                    if (shot.id === pair[0].id)
                      expect(text.x + text.width).toBeLessThanOrEqual(
                        centerX - boundWidth / 2,
                      );
                    else
                      expect(1080 + text.x).toBeGreaterThanOrEqual(
                        centerX + boundWidth / 2,
                      );
                  }
                }
              }
            }
    },
  );
});

describe("panorama units in a series", () => {
  it.each([0, 1])(
    "duplicates both halves from half %i with independent copied data",
    (half) => {
      const project = projectWithShots();
      applyPanorama(project, project.shots[1].id);
      const original = assertPair(project, project.shots[1].id);
      const newId = duplicateUnit(project, original[half].id)!;
      const copies = assertPair(project, newId);
      expect(project.shots).toHaveLength(6);
      expect(project.shots.indexOf(copies[0])).toBe(
        project.shots.indexOf(original[1]) + 1,
      );
      expect(new Set(project.shots.map((shot) => shot.id)).size).toBe(6);
      for (let index = 0; index < 2; index++) {
        expect({ ...copies[index], id: original[index].id }).toEqual(
          original[index],
        );
        expect(copies[index].phone).not.toBe(original[index].phone);
        expect(copies[index].style).not.toBe(original[index].style);
      }
      editLinkedShots(project, newId, (shot) => {
        shot.style.background = "#567890";
      });
      expect(resolveStyle(project, original[0]).background).not.toBe("#567890");
    },
  );

  it.each([0, 1])("moves and removes a complete pair from half %i", (half) => {
    const project = projectWithShots();
    applyPanorama(project, project.shots[1].id);
    const pair = assertPair(project, project.shots[1].id);
    const first = project.shots[0],
      last = project.shots.at(-1)!;
    moveUnit(project, pair[half].id, -1);
    expect(project.shots.map((shot) => shot.id)).toEqual([
      pair[0].id,
      pair[1].id,
      first.id,
      last.id,
    ]);
    assertPair(project, pair[half].id);
    moveUnit(project, pair[half].id, -1);
    expect(project.shots[0]).toBe(pair[0]);
    moveUnit(project, pair[half].id, 1);
    moveUnit(project, pair[half].id, 1);
    expect(project.shots.map((shot) => shot.id)).toEqual([
      first.id,
      last.id,
      pair[0].id,
      pair[1].id,
    ]);
    assertPair(project, pair[half].id);
    moveUnit(project, pair[half].id, 1);
    expect(project.shots.at(-1)).toBe(pair[1]);
    removeUnit(project, pair[half].id);
    expect(project.shots).toEqual([first, last]);
    expect(() => validateProject(project)).not.toThrow();
  });

  it("moves neighboring panorama pairs as separate intact units", () => {
    const project = projectWithShots(2);
    applyPanorama(project, project.shots[0].id);
    applyPanorama(project, project.shots[2].id);
    const first = assertPair(project, project.shots[0].id);
    const second = assertPair(project, project.shots[2].id);
    moveUnit(project, second[1].id, -1);
    expect(project.shots).toEqual([...second, ...first]);
    assertPair(project, first[0].id);
    assertPair(project, second[0].id);
  });

  it.each([
    ["play-phone-portrait", 8],
    ["apple-iphone69-portrait", 10],
    ["portfolio-card", 20],
  ] as const)(
    "honors %s capacity %i without partial mutations",
    (profile, capacity) => {
      const full = projectWithShots(capacity, profile);
      expect(shotCapacity(full)).toBe(capacity);
      const before = structuredClone(full);
      expect(() => applyPanorama(full, full.shots[0].id)).toThrow(/two slides/);
      expect(duplicateUnit(full, full.shots[0].id)).toBeUndefined();
      expect(full).toEqual(before);

      const exact = projectWithShots(capacity - 1, profile);
      applyPanorama(exact, exact.shots[0].id);
      const pair = assertPair(exact, exact.shots[0].id);
      expect(exact.shots).toHaveLength(capacity);
      expect(() => applyPanorama(exact, pair[1].id)).not.toThrow();
      const after = structuredClone(exact);
      expect(duplicateUnit(exact, pair[1].id)).toBeUndefined();
      expect(exact).toEqual(after);
      removeUnit(exact, exact.shots.at(-1)!.id);
      expect(duplicateUnit(exact, pair[0].id)).toBeUndefined();
      removeUnit(exact, exact.shots.at(-1)!.id);
      expect(duplicateUnit(exact, pair[1].id)).toBeDefined();
      expect(exact.shots).toHaveLength(capacity);
      expect(() => validateProject(exact)).not.toThrow();
    },
  );
});

describe("panorama template changes and undo", () => {
  it.each([0, 1])(
    "separates both halves when applying a regular template from half %i",
    (half) => {
      const project = projectWithShots();
      applyPanorama(project, project.shots[1].id);
      const pair = assertPair(project, project.shots[1].id);
      const untouched = structuredClone(project.shots[0]);
      const ids = project.shots.map((shot) => shot.id);
      applyTemplate(project, pair[half].id, "studio");
      expect(project.shots.map((shot) => shot.id)).toEqual(ids);
      expect(panoramaPair(project, pair[0].id)).toBeNull();
      expect(panoramaPair(project, pair[1].id)).toBeNull();
      for (const shot of pair) {
        expect(resolveStyle(project, shot).template).toBe("studio");
        expect(shot.phone).toEqual(
          templateLayout(project, resolveStyle(project, shot)).phone,
        );
      }
      expect(project.shots[0]).toEqual(untouched);
      expect(() => validateProject(project)).not.toThrow();
    },
  );

  it("applies a regular template to a mixed series and clears every pair role", () => {
    const project = projectWithShots();
    applyPanorama(project, project.shots[0].id);
    applyPanorama(project, project.shots[3].id);
    const ids = project.shots.map((shot) => shot.id);
    applyTemplate(project, project.shots[1].id, "gallery", true, true);
    expect(project.shots.map((shot) => shot.id)).toEqual(ids);
    expect(project.style.template).toBe("gallery");
    for (const shot of project.shots) {
      expect(resolveStyle(project, shot).template).toBe("gallery");
      expect(panoramaPair(project, shot.id)).toBeNull();
    }
    expect(() => validateProject(project)).not.toThrow();
  });

  it("refuses a whole-series panorama application before editing anything", () => {
    const project = projectWithShots();
    const before = structuredClone(project);
    expect(() =>
      applyTemplate(project, project.shots[0].id, "panorama", true),
    ).toThrow(/one screenshot/);
    expect(project).toEqual(before);
  });

  it("undoes profile and custom reflow while preserving the linked pair", () => {
    const project = projectWithShots(1);
    applyPanorama(project, project.shots[0].id);
    useEditor.getState().open({ project, assets: [], revision: 1 });
    const initial = structuredClone(project);
    useEditor
      .getState()
      .edit((draft) => changeExportProfile(draft, "portfolio-custom"));
    const profileChanged = structuredClone(useEditor.getState().project!);
    assertPair(profileChanged, profileChanged.shots[0].id);
    useEditor
      .getState()
      .edit((draft) => changeCustomSize(draft, { width: 1103, height: 1537 }));
    const customChanged = structuredClone(useEditor.getState().project!);
    const pair = assertPair(customChanged, customChanged.shots[0].id);
    expect(pair[0].phone).not.toEqual(profileChanged.shots[0].phone);
    expect(useEditor.getState().past).toHaveLength(2);
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: profileChanged.updatedAt,
    }).toEqual(profileChanged);
    useEditor.getState().undo();
    expect({
      ...useEditor.getState().project,
      updatedAt: initial.updatedAt,
    }).toEqual(initial);
    useEditor.getState().redo();
    useEditor.getState().redo();
    expect({
      ...useEditor.getState().project,
      updatedAt: customChanged.updatedAt,
    }).toEqual(customChanged);
    assertPair(useEditor.getState().project!, pair[1].id);
  });
});

describe("panorama backup", () => {
  it.each(Object.keys(panoramaFamilies) as PanoramaId[])(
    "round-trips %s roles, text and original image bytes",
    async (family) => {
      const imageBytes = Uint8Array.from(
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        ),
        (character) => character.charCodeAt(0),
      );
      class FakeImage {
        naturalWidth = 1;
        naturalHeight = 1;
        decoding = "";
        onload: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.(new Event("load")));
        }
      }
      vi.stubGlobal("Image", FakeImage);
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
      vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
      const project = projectWithShots(1, "portfolio-card-portrait");
      applyPanorama(project, project.shots[0].id, false, family);
      project.shots[0].title = "One continuous scene";
      project.shots[1].title = "Two individual slides";
      const asset: Asset = {
        id: "asset-0",
        name: "screen.png",
        mime: "image/png",
        width: 1,
        height: 1,
        blob: new Blob([imageBytes], { type: "image/png" }),
      };
      const backup = await exportProject(project, [asset]);
      const files = unzipSync(new Uint8Array(await backup.arrayBuffer()));
      expect(Object.keys(files)).toEqual([
        "project.json",
        "assets/asset-0.png",
      ]);
      const restored = await importProject(
        new File([backup], "panorama.henscreenshots"),
      );
      const pair = assertPair(
        restored.project,
        restored.project.shots[1].id,
        family,
      );
      expect(restored.project.exportProfile).toBe(project.exportProfile);
      expect(restored.project.id).not.toBe(project.id);
      expect(restored.assets).toHaveLength(1);
      expect(
        new Uint8Array(await restored.assets[0].blob.arrayBuffer()),
      ).toEqual(imageBytes);
      for (let index = 0; index < 2; index++) {
        expect(pair[index].id).not.toBe(project.shots[index].id);
        expect(pair[index].assetId).toBe(restored.assets[0].id);
        expect(pair[index].style).toEqual(project.shots[index].style);
        expect(pair[index].phone).toEqual(project.shots[index].phone);
        expect(pair[index].title).toBe(project.shots[index].title);
      }
    },
  );
});

describe.each(Object.keys(panoramaFamilies) as PanoramaId[])(
  "%s panorama families",
  (family) => {
    it.each([false, true])(
      "keeps previews identical to application and preserves both captions (keep colors: %s)",
      (keepColors) => {
        const project = projectWithShots(2);
        applyPanorama(project, project.shots[0].id);
        const original = structuredClone(project);
        const pair = panoramaPair(project, project.shots[0].id)!;
        const previews = panoramaPreview(project, pair[1], keepColors, family);
        expect(project).toEqual(original);
        applyTemplate(project, pair[1].id, family, false, keepColors);
        expect(project.shots).toEqual([...previews, original.shots[2]]);
        assertPair(project, pair[1].id, family);
        if (keepColors)
          for (const key of [
            "background",
            "backgroundEnd",
            "accentColor",
            "textColor",
          ] as const)
            expect(resolveStyle(project, project.shots[0])[key]).toBe(
              resolveStyle(original, original.shots[0])[key],
            );
        expect(
          project.shots.map((s) => [s.id, s.title, s.subtitle, s.assetId]),
        ).toEqual(
          original.shots.map((s) => [s.id, s.title, s.subtitle, s.assetId]),
        );
      },
    );
    it("duplicates, moves, removes and separates the complete pair", () => {
      const project = projectWithShots(2);
      applyTemplate(project, project.shots[0].id, family);
      const pair = assertPair(project, project.shots[1].id, family);
      const copy = duplicateUnit(project, pair[1].id)!;
      assertPair(project, copy, family);
      moveUnit(project, pair[1].id, 1);
      expect(project.shots[0].id).toBe(copy);
      removeUnit(project, pair[1].id);
      expect(project.shots).toHaveLength(3);
      applyTemplate(project, copy, "bloom");
      expect(panoramaPair(project, copy)).toBeNull();
      expect(
        project.shots.slice(0, 2).map((s) => resolveStyle(project, s).template),
      ).toEqual(["bloom", "bloom"]);
      validateProject(project);
    });
    it("rejects a right half from a different family and an orphaned right half", () => {
      const project = projectWithShots(1);
      applyTemplate(project, project.shots[0].id, family);
      project.shots[1].style.template =
        family === "daybreak" ? "tidal-end" : "daybreak-end";
      expect(() => validateProject(project)).toThrow();
      project.shots.shift();
      expect(() => validateProject(project)).toThrow();
    });
  },
);

describe("source-only destination", () => {
  it("temporarily renders panorama captures individually and restores their link when changing destination", () => {
    const project = projectWithShots(1);
    applyPanorama(project, project.shots[0].id);
    changeExportProfile(project, "play-wear");
    expect(panoramaPair(project, project.shots[0].id)).toBeNull();
    expect(linkedShots(project, project.shots[0].id)).toHaveLength(1);
    expect(project.shots).toHaveLength(2);
    changeExportProfile(project, "play-phone-portrait");
    expect(panoramaPair(project, project.shots[0].id)).not.toBeNull();
  });
});
