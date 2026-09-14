import { describe, expect, it, vi } from "vitest";
import { createProject, createShot } from "../core/model";
import {
  addLanguage,
  applyTranslations,
  reviewTranslation,
  writeText,
} from "../core/localization";
import { languageJobs, translateLanguages, uniquePacks } from "./batch";

function fixture() {
  const project = createProject("Translation queue QA");
  project.shots = [
    createShot(null, 0),
    createShot(null, 1),
    createShot(null, 2),
  ];
  for (const code of ["es", "fr", "pt-BR"]) addLanguage(project, "en", code);
  return project;
}

describe("series translation queue", () => {
  it("selects supported, added languages once and protects manual/reviewed text", () => {
    const project = fixture();
    writeText(project.shots[0], "es", "title", "Edited by me");
    reviewTranslation(project.shots[1], "es");
    project.shots[1].title = "Updated original";
    const jobs = languageJobs(project, ["es", "fr", "pt-BR", "de", "es"]);
    expect(jobs.map((job) => [job.locale, job.entries.length])).toEqual([
      ["es", 1],
      ["fr", 3],
    ]);
    expect(jobs[0].entries[0].shotId).toBe(project.shots[2].id);
    expect(languageJobs(project, ["es"], true)[0].entries).toHaveLength(3);
  });

  it("deduplicates shared packs for routes through English", () => {
    const project = createProject();
    project.shots = [createShot(null, 0)];
    addLanguage(project, "es", "fr");
    addLanguage(project, "es", "de");
    const jobs = languageJobs(project, ["fr", "de"]);
    expect(jobs.flatMap((job) => job.packs)).toHaveLength(4);
    expect(uniquePacks(jobs).map((pack) => pack.id)).toEqual([
      "Xenova/opus-mt-es-en",
      "Xenova/opus-mt-en-fr",
      "Xenova/opus-mt-en-de",
    ]);
  });

  it("runs one language at a time using the original text and applies completed languages", async () => {
    const project = fixture();
    const original = structuredClone(project);
    const events: string[] = [];
    let active = 0;
    const jobs = languageJobs(project, ["es", "fr"]);
    await translateLanguages(
      jobs,
      new AbortController().signal,
      vi.fn(),
      (code, entries) => {
        events.push(`apply:${code}`);
        applyTranslations(project, code, entries);
      },
      async (job) => {
        expect(active++).toBe(0);
        expect(job.entries[0].title).toBe(original.shots[0].title);
        events.push(`start:${(job as (typeof jobs)[number]).locale}`);
        await Promise.resolve();
        active--;
        return job.entries.map((entry) => ({
          ...entry,
          title: "Translated draft",
        }));
      },
    );
    expect(events).toEqual(["start:es", "apply:es", "start:fr", "apply:fr"]);
    expect(project.shots[0].translations?.es.title).toBe("Translated draft");
    expect(project.shots[0].translations?.fr.status).toBe("draft");
    expect(project.style).toEqual(original.style);
    expect(project.shots[0].phone).toEqual(original.shots[0].phone);
    expect(project.shots[0].title).toBe(original.shots[0].title);
  });

  it("keeps completed languages after a failure and resumes only untranslated work", async () => {
    const project = fixture();
    let calls = 0;
    await expect(
      translateLanguages(
        languageJobs(project, ["es", "fr"]),
        new AbortController().signal,
        vi.fn(),
        (code, entries) => applyTranslations(project, code, entries),
        async (job) => {
          if (calls++) throw new Error("Download failed");
          return job.entries.map((entry) => ({ ...entry, title: "ES draft" }));
        },
      ),
    ).rejects.toThrow("Download failed");
    expect(project.shots[0].translations?.es.title).toBe("ES draft");
    expect(project.shots[0].translations?.fr.status).toBe("untranslated");
    expect(
      languageJobs(project, ["es", "fr"]).map((job) => job.locale),
    ).toEqual(["fr"]);
  });

  it("does not apply a late result or start another language after cancellation", async () => {
    const controller = new AbortController();
    const apply = vi.fn();
    const translate = vi.fn(async (job) => {
      controller.abort();
      return job.entries;
    });
    await expect(
      translateLanguages(
        languageJobs(fixture(), ["es", "fr"]),
        controller.signal,
        vi.fn(),
        apply,
        translate,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(apply).not.toHaveBeenCalled();
    expect(translate).toHaveBeenCalledTimes(1);
  });
});
