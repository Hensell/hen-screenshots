import type { Project, Shot, TextElement } from "./model";

// Start with scripts covered by our bundled fonts. Regional versions remain distinct.
export const languages = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["pt", "Português"],
  ["pt-BR", "Português (Brasil)"],
  ["it", "Italiano"],
  ["nl", "Nederlands"],
  ["da", "Dansk"],
  ["sv", "Svenska"],
  ["no", "Norsk"],
  ["fi", "Suomi"],
  ["pl", "Polski"],
  ["cs", "Čeština"],
  ["ro", "Română"],
  ["hu", "Magyar"],
  ["tr", "Türkçe"],
  ["id", "Bahasa Indonesia"],
] as const;
export const MAX_LANGUAGES = 10;
export const languageName = (code: string) =>
  languages.find(([id]) => id === code)?.[1] ?? code;
export const isLanguage = (code: unknown): code is string =>
  languages.some(([id]) => id === code);
export interface LocalizedShot {
  deviceAssets?: Partial<Record<"secondary" | "tertiary", string>>;
  title: string;
  subtitle: string;
  sourceTitle: string;
  sourceSubtitle: string;
  status: "untranslated" | "draft" | "reviewed";
  textOffsets?: Shot["textOffsets"];
  titleSize?: number;
  assetId?: string;
}

export function localeStatus(shot: Shot, locale: string) {
  const content = shot.translations?.[locale];
  if (!content || content.status === "untranslated") return "untranslated";
  if (
    content.sourceTitle !== shot.title ||
    content.sourceSubtitle !== shot.subtitle
  )
    return "outdated";
  return content.status;
}

/** Content copies are independent; absence of a placement override inherits the shared design. */
export function localContent(shot: Shot, locale: string): LocalizedShot {
  shot.translations ??= {};
  return (shot.translations[locale] ??= {
    title: shot.title,
    subtitle: shot.subtitle,
    sourceTitle: shot.title,
    sourceSubtitle: shot.subtitle,
    status: "untranslated",
  });
}
export function addLanguage(project: Project, source: string, target: string) {
  if (!isLanguage(source) || !isLanguage(target) || source === target)
    throw new Error("Choose two different languages.");
  if (project.localization && project.localization.source !== source)
    throw new Error("Keep the original language while translations exist.");
  const targets = project.localization?.targets ?? [];
  if (targets.includes(target))
    throw new Error("This language is already in the project.");
  if (targets.length >= MAX_LANGUAGES - 1)
    throw new Error(`A project supports up to ${MAX_LANGUAGES} languages.`);
  project.localization = { source, targets: [...targets, target] };
  project.shots.forEach((shot) => localContent(shot, target));
}
export function removeLanguage(project: Project, locale: string) {
  if (!project.localization || locale === project.localization.source) return;
  project.localization.targets = project.localization.targets.filter(
    (code) => code !== locale,
  );
  project.shots.forEach((shot) => {
    delete shot.translations?.[locale];
    if (shot.translations && !Object.keys(shot.translations).length)
      delete shot.translations;
  });
}
export function writeText(
  shot: Shot,
  locale: string | null,
  key: TextElement,
  value: string,
) {
  if (!locale) {
    shot[key] = value;
    return;
  }
  const content = localContent(shot, locale);
  content[key] = value;
  content[key === "title" ? "sourceTitle" : "sourceSubtitle"] = shot[key];
  content.status = "draft";
}
export function reviewTranslation(shot: Shot, locale: string) {
  const content = localContent(shot, locale);
  content.status = "reviewed";
  content.sourceTitle = shot.title;
  content.sourceSubtitle = shot.subtitle;
}

/** A disposable view: never save it. Every renderer receives the same resolved language. */
export function localizedProject(
  project: Project,
  locale: string | null,
): Project {
  if (!locale || !project.localization?.targets.includes(locale))
    return project;
  return {
    ...project,
    shots: project.shots.map((shot) => {
      const content = shot.translations?.[locale];
      return content
        ? {
            ...shot,
            title: content.title,
            subtitle: content.subtitle,
            assetId: content.assetId ?? shot.assetId,
            ...(shot.companions
              ? {
                  companions: shot.companions.map((device) => ({
                    ...device,
                    assetId:
                      content.deviceAssets?.[device.id] ?? device.assetId,
                  })),
                }
              : {}),
            textOffsets: { ...shot.textOffsets, ...content.textOffsets },
            style: {
              ...shot.style,
              ...(content.titleSize === undefined
                ? {}
                : { titleSize: content.titleSize }),
            },
          }
        : shot;
    }),
  };
}

export function referencedAssetIds(project: Project) {
  return [
    ...new Set(
      project.shots.flatMap((shot) => [
        shot.assetId,
        ...(shot.companions ?? []).map((device) => device.assetId),
        ...Object.values(shot.translations ?? {}).flatMap((content) => [
          ...(content.assetId ? [content.assetId] : []),
          ...Object.values(content.deviceAssets ?? {}),
        ]),
      ]),
    ),
  ];
}

export interface TranslationDraft {
  shotId: string;
  title: string;
  subtitle: string;
  sourceTitle: string;
  sourceSubtitle: string;
}
/** Apply a finished batch atomically; a cancelled run never touches project text. */
export function applyTranslations(
  project: Project,
  locale: string,
  entries: TranslationDraft[],
) {
  if (!project.localization?.targets.includes(locale))
    throw new Error("This language is no longer in the project.");
  for (const entry of entries) {
    const shot = project.shots.find((shot) => shot.id === entry.shotId);
    if (
      !shot ||
      shot.title !== entry.sourceTitle ||
      shot.subtitle !== entry.sourceSubtitle
    )
      throw new Error("The original text changed. Translate the series again.");
    if (
      entry.title.length > 300 ||
      entry.subtitle.length > 450 ||
      /\0/.test(entry.title + entry.subtitle)
    )
      throw new Error("A translation is too long. Edit this slide manually.");
  }
  entries.forEach((entry) => {
    const shot = project.shots.find((shot) => shot.id === entry.shotId)!;
    Object.assign(localContent(shot, locale), {
      title: entry.title,
      subtitle: entry.subtitle,
      sourceTitle: entry.sourceTitle,
      sourceSubtitle: entry.sourceSubtitle,
      status: "draft",
    });
  });
}
