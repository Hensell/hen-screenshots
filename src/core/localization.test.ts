import { describe, expect, it } from "vitest";
import {
  createProject,
  createShot,
  migrateProject,
  validateProject,
  type V6Project,
} from "./model";
import {
  addLanguage,
  localContent,
  localizedProject,
  localeStatus,
  writeText,
  reviewTranslation,
  removeLanguage,
  applyTranslations,
  referencedAssetIds,
} from "./localization";
import {
  applyTemplate,
  changeExportProfile,
  templatePreview,
} from "./templates";
import { duplicateUnit, moveUnit, removeUnit, linkedShots } from "./panorama";
import { translationRoute } from "../translation/catalog";
function fixture() {
  const project = createProject("Language QA");
  project.shots = [createShot("image", 0), createShot("second", 1)];
  addLanguage(project, "en", "es");
  return project;
}
describe("linked language versions", () => {
  it("migrates schema 6 without changing compositions or introducing language assumptions", () => {
    const original: V6Project = {
      ...createProject(),
      schemaVersion: 6,
      shots: [createShot("image", 0)],
    };
    const before = structuredClone(original);
    expect(migrateProject(original)).toEqual({ ...before, schemaVersion: 7 });
    expect(original).toEqual(before);
    expect(migrateProject(original).localization).toBeUndefined();
  });
  it("keeps translations independent while shared design edits appear in every version", () => {
    const p = fixture(),
      shot = p.shots[0];
    writeText(shot, "es", "title", "Pequeños hábitos. Una gran historia.");
    p.style.background = "#112233";
    shot.phone.x = 125;
    const view = localizedProject(p, "es");
    expect(view.shots[0].title).toBe("Pequeños hábitos. Una gran historia.");
    expect(shot.title).toBe("Your app.\nBeautifully presented.");
    expect(view.shots[0].phone.x).toBe(125);
    expect(view.style.background).toBe("#112233");
    expect(localizedProject(p, null)).toBe(p);
    validateProject(p);
  });
  it("inherits positions unless a language overrides them, including explicit zero", () => {
    const p = fixture(),
      shot = p.shots[0];
    shot.textOffsets = { title: { x: 90, y: 120 } };
    expect(localizedProject(p, "es").shots[0].textOffsets?.title).toEqual({
      x: 90,
      y: 120,
    });
    localContent(shot, "es").textOffsets = { title: { x: 0, y: 0 } };
    localContent(shot, "es").titleSize = 60;
    expect(localizedProject(p, "es").shots[0].textOffsets?.title).toEqual({
      x: 0,
      y: 0,
    });
    expect(localizedProject(p, "es").shots[0].style.titleSize).toBe(60);
    expect(shot.style.titleSize).toBeUndefined();
    delete localContent(shot, "es").textOffsets;
    expect(localizedProject(p, "es").shots[0].textOffsets?.title).toEqual(
      shot.textOffsets.title,
    );
  });
  it("marks stale translations without overwriting edited captions", () => {
    const p = fixture(),
      shot = p.shots[0];
    expect(localeStatus(shot, "es")).toBe("untranslated");
    writeText(shot, "es", "title", "Mis hábitos");
    expect(localeStatus(shot, "es")).toBe("draft");
    reviewTranslation(shot, "es");
    expect(localeStatus(shot, "es")).toBe("reviewed");
    shot.subtitle = "A new original.";
    expect(localeStatus(shot, "es")).toBe("outdated");
    writeText(shot, "es", "title", "Mis nuevos hábitos");
    expect(localeStatus(shot, "es")).toBe("outdated");
    expect(shot.translations!.es.title).toBe("Mis nuevos hábitos");
    reviewTranslation(shot, "es");
    expect(localeStatus(shot, "es")).toBe("reviewed");
  });
  it("refits translated text with a new canvas or template without changing its words", () => {
    const p = fixture(),
      shot = p.shots[0];
    writeText(shot, "es", "title", "Mis hábitos");
    const translated = localContent(shot, "es");
    translated.textOffsets = { title: { x: 90, y: 120 } };
    translated.titleSize = 60;
    templatePreview(p, shot, "studio", false);
    expect(translated.textOffsets).toBeDefined();
    changeExportProfile(p, "play-phone-landscape");
    expect(translated.textOffsets).toBeUndefined();
    expect(translated.titleSize).toBe(60);
    translated.textOffsets = { title: { x: 40, y: 50 } };
    applyTemplate(p, shot.id, "studio");
    expect(translated.textOffsets).toBeUndefined();
    expect(translated.titleSize).toBeUndefined();
    expect(translated.title).toBe("Mis hábitos");
    translated.titleSize = 70;
    applyTemplate(p, shot.id, "panorama");
    expect(p.shots[0].translations!.es.titleSize).toBeUndefined();
    expect(p.shots[0].translations!.es.title).toBe("Mis hábitos");
    validateProject(p);
  });
  it("keeps language content with slide duplicates, reorder, delete and linked panoramas", () => {
    const p = fixture();
    writeText(p.shots[0], "es", "title", "Uno");
    const id = duplicateUnit(p, p.shots[0].id)!;
    const copy = p.shots.find((shot) => shot.id === id)!;
    expect(copy.translations!.es.title).toBe("Uno");
    writeText(copy, "es", "title", "Dos");
    expect(p.shots[0].translations!.es.title).toBe("Uno");
    moveUnit(p, id, 1);
    expect(p.shots.at(-1)!.id).toBe(id);
    removeUnit(p, id);
    expect(p.shots).toHaveLength(2);
    applyTemplate(p, p.shots[0].id, "panorama");
    const pair = linkedShots(p, p.shots[0].id);
    expect(pair).toHaveLength(2);
    expect(pair[1].translations!.es.status).toBe("untranslated");
    writeText(pair[1], "es", "title", "Otro día");
    expect(pair[0].translations!.es.title).toBe("Uno");
    validateProject(p);
  });
  it("requires both panorama halves to share the localized image", () => {
    const p = fixture();
    applyTemplate(p, p.shots[0].id, "panorama");
    localContent(p.shots[0], "es").assetId = "spanish-image";
    expect(() => validateProject(p)).toThrow();
    localContent(p.shots[1], "es").assetId = "spanish-image";
    validateProject(p);
    expect(referencedAssetIds(p)).toEqual(["image", "spanish-image", "second"]);
    expect(localizedProject(p, "es").shots[0].assetId).toBe("spanish-image");
    expect(p.shots[0].assetId).toBe("image");
  });
  it("removes only one language and its image references", () => {
    const p = fixture();
    addLanguage(p, "en", "fr");
    localContent(p.shots[0], "es").assetId = "spanish-image";
    removeLanguage(p, "es");
    expect(p.localization!.targets).toEqual(["fr"]);
    expect(p.shots[0].translations!.es).toBeUndefined();
    expect(p.shots[0].translations!.fr).toBeDefined();
    expect(referencedAssetIds(p)).not.toContain("spanish-image");
    validateProject(p);
  });
  it("applies a whole translation batch only after checking all source texts and lengths", () => {
    const p = fixture();
    const entries = p.shots.map((shot) => ({
      shotId: shot.id,
      sourceTitle: shot.title,
      sourceSubtitle: shot.subtitle,
      title: "Título",
      subtitle: "Texto",
    }));
    const before = structuredClone(p);
    expect(() =>
      applyTranslations(p, "es", [
        entries[0],
        { ...entries[1], title: "a".repeat(301) },
      ]),
    ).toThrow();
    expect(p).toEqual(before);
    expect(() =>
      applyTranslations(p, "es", [
        entries[0],
        { ...entries[1], sourceTitle: "changed" },
      ]),
    ).toThrow();
    expect(p).toEqual(before);
    applyTranslations(p, "es", entries);
    expect(
      p.shots.every((shot) => shot.translations!.es.title === "Título"),
    ).toBe(true);
    expect(localeStatus(p.shots[0], "es")).toBe("draft");
  });
  it.each([
    (p: ReturnType<typeof fixture>) => {
      p.localization!.targets.push("es");
    },
    (p: ReturnType<typeof fixture>) => {
      p.localization!.targets.push("en");
    },
    (p: ReturnType<typeof fixture>) => {
      p.localization!.source = "../../en";
    },
    (p: ReturnType<typeof fixture>) => {
      p.shots[0].translations!.fr = p.shots[0].translations!.es;
    },
    (p: ReturnType<typeof fixture>) => {
      localContent(p.shots[0], "es").titleSize = NaN;
    },
    (p: ReturnType<typeof fixture>) => {
      localContent(p.shots[0], "es").assetId = "../image";
    },
    (p: ReturnType<typeof fixture>) => {
      localContent(p.shots[0], "es").textOffsets = {
        title: { x: Infinity, y: 0 },
      };
    },
  ])("rejects malformed localization metadata", (mutate) => {
    const p = fixture();
    mutate(p);
    expect(() => validateProject(p)).toThrow();
  });
  it("routes supported language pairs and leaves other languages manual", () => {
    expect(translationRoute("en", "es")?.map((p) => p.id)).toEqual([
      "Xenova/opus-mt-en-es",
    ]);
    expect(translationRoute("fr", "es")?.map((p) => p.id)).toEqual([
      "Xenova/opus-mt-fr-en",
      "Xenova/opus-mt-en-es",
    ]);
    expect(translationRoute("pt", "es")).toBeNull();
    expect(translationRoute("en", "en")).toBeNull();
  });
});
