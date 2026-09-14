import type { Project } from "../core/model";
import { localeStatus, type TranslationDraft } from "../core/localization";
import { translationRoute, type TranslationPack } from "./catalog";
import {
  translateLocally,
  type TranslationJob,
  type TranslationProgress,
} from "./client";

export interface LanguageJob extends TranslationJob {
  locale: string;
}

export function languageJobs(
  project: Project,
  selected: string[],
  replace = false,
): LanguageJob[] {
  const source = project.localization?.source;
  if (!source) return [];
  return [...new Set(selected)].flatMap((locale) => {
    if (!project.localization?.targets.includes(locale)) return [];
    const packs = translationRoute(source, locale);
    if (!packs) return [];
    const entries = project.shots
      .filter(
        (shot) => replace || localeStatus(shot, locale) === "untranslated",
      )
      .map((shot) => ({
        shotId: shot.id,
        title: shot.title,
        subtitle: shot.subtitle,
        sourceTitle: shot.title,
        sourceSubtitle: shot.subtitle,
      }));
    return entries.length ? [{ locale, packs, entries }] : [];
  });
}

export function uniquePacks(jobs: LanguageJob[]): TranslationPack[] {
  return [
    ...new Map(
      jobs
        .flatMap((job) => job.packs)
        .map((pack) => [pack.id + "@" + pack.revision, pack]),
    ).values(),
  ];
}

/** One worker/language at a time. Each worker translates slides individually and
 * releases its model before the next language. Only complete languages are applied. */
export async function translateLanguages(
  jobs: LanguageJob[],
  signal: AbortSignal,
  onProgress: (locale: string, progress: TranslationProgress) => void,
  onComplete: (locale: string, entries: TranslationDraft[]) => void,
  translate = translateLocally,
) {
  for (const job of jobs) {
    signal.throwIfAborted();
    const entries = await translate(job, signal, (progress) => {
      if (!signal.aborted) onProgress(job.locale, progress);
    });
    signal.throwIfAborted();
    onComplete(job.locale, entries);
  }
}
