import {
  createProject,
  createShot,
  LIMITS,
  validateProject,
  type Asset,
  type DeviceFamily,
  type Project,
  type Shot,
  type Style,
  type TemplateId,
} from "../core/model";
import {
  exportProfiles,
  isBannerProfile,
  resolveExportProfile,
  validateCustomSize,
  type ExportProfileId,
} from "../core/export-profiles";
import {
  applyTemplate,
  getTemplate,
  templates,
  resetComposition,
} from "../core/templates";
import { bannerTemplates } from "../core/banner-templates";
import { isPanoramaTemplate, panoramaPair } from "../core/panorama";
import { applyBrandKit } from "../core/brand-application";
import type { BrandKit } from "../core/brand-kit";
import { addLanguage, isLanguage, writeText } from "../core/localization";

interface Captions {
  title: string;
  subtitle?: string;
  translations?: Record<string, { title: string; subtitle?: string }>;
}
export interface SlideSpec extends Captions {
  image: string;
  template?: TemplateId;
  device?: DeviceFamily;
  companions?: string[];
  placement?: Shot["phone"];
  textOffsets?: Shot["textOffsets"];
  style?: Partial<Style>;
  continuation?: Captions;
}
export interface DesignSpec {
  version: 1;
  name: string;
  profile: ExportProfileId;
  template?: TemplateId;
  device?: DeviceFamily;
  sourceLanguage?: string;
  customSize?: Project["customSize"];
  brandKit?: string;
  slides: SlideSpec[];
}
function object(
  value: unknown,
  keys: string[],
  at: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${at} must be an object.`);
  for (const key of Object.keys(value))
    if (!keys.includes(key))
      throw new Error(
        `Unknown field ${at}.${key}. Check the plugin's design-spec reference.`,
      );
  return value as Record<string, unknown>;
}
function string(
  value: unknown,
  max: number,
  at: string,
  allowEmpty = false,
): asserts value is string {
  if (
    typeof value !== "string" ||
    (!allowEmpty && !value.trim()) ||
    value.length > max ||
    value.includes("\0")
  )
    throw new Error(
      `${at} must be ${allowEmpty ? "0" : "1"}–${max} characters.`,
    );
}
function choices(raw: Record<string, unknown>, at: string) {
  if (
    raw.template !== undefined &&
    ![...templates, ...bannerTemplates].some((t) => t.id === raw.template)
  )
    throw new Error(`Unknown template at ${at}.template. Run hen templates.`);
  if (
    raw.device !== undefined &&
    ![
      "android",
      "ios",
      "ipad",
      "android-tablet",
      "monitor",
      "laptop",
      "card",
    ].includes(raw.device as string)
  )
    throw new Error(`Unknown device at ${at}.device.`);
}
function captions(raw: Record<string, unknown>, at: string) {
  string(raw.title, 100, `${at}.title`, true);
  if (raw.subtitle !== undefined)
    string(raw.subtitle, 180, `${at}.subtitle`, true);
  if (raw.translations !== undefined) {
    if (
      !raw.translations ||
      typeof raw.translations !== "object" ||
      Array.isArray(raw.translations)
    )
      throw new Error(
        `${at}.translations must map language codes to captions.`,
      );
    for (const [language, value] of Object.entries(raw.translations)) {
      if (!isLanguage(language))
        throw new Error(
          `Unsupported language: ${language}. Run hen languages.`,
        );
      const text = object(
        value,
        ["title", "subtitle"],
        `${at}.translations.${language}`,
      );
      captions(text, `${at}.translations.${language}`);
    }
  }
}
/** A small authoring contract, separate from the versioned full project document. */
export function parseDesignSpec(value: unknown): DesignSpec {
  const raw = object(
    value,
    [
      "version",
      "name",
      "profile",
      "template",
      "device",
      "sourceLanguage",
      "customSize",
      "brandKit",
      "slides",
    ],
    "design",
  );
  if (raw.version !== 1) throw new Error("Use design spec version 1.");
  string(raw.name, 80, "name");
  choices(raw, "design");
  if (raw.customSize !== undefined) {
    object(raw.customSize, ["width", "height"], "customSize");
    validateCustomSize(raw.customSize as Project["customSize"]);
    if (raw.profile !== "portfolio-custom")
      throw new Error("customSize requires the portfolio-custom profile.");
  }
  if (!exportProfiles.some((p) => p.id === raw.profile))
    throw new Error(
      "Unknown export profile. Run hen profiles for supported IDs.",
    );
  if (raw.sourceLanguage !== undefined && !isLanguage(raw.sourceLanguage))
    throw new Error("Unsupported sourceLanguage. Run hen languages.");
  if (raw.brandKit !== undefined) string(raw.brandKit, 4096, "brandKit");
  if (
    !Array.isArray(raw.slides) ||
    !raw.slides.length ||
    raw.slides.length > LIMITS.shots
  )
    throw new Error("Provide 1–20 slides.");
  raw.slides.forEach((value, index) => {
    const at = `slides[${index}]`;
    const slide = object(
      value,
      [
        "image",
        "title",
        "subtitle",
        "template",
        "device",
        "companions",
        "placement",
        "textOffsets",
        "style",
        "translations",
        "continuation",
      ],
      at,
    );
    string(slide.image, 4096, `${at}.image`);
    choices(slide, at);
    if (slide.placement !== undefined)
      object(
        slide.placement,
        ["x", "y", "width", "rotation"],
        `${at}.placement`,
      );
    if (slide.textOffsets !== undefined)
      object(slide.textOffsets, ["title", "subtitle"], `${at}.textOffsets`);
    captions(slide, at);
    if (slide.companions !== undefined) {
      if (!Array.isArray(slide.companions) || slide.companions.length > 2)
        throw new Error(`${at}.companions accepts up to two image paths.`);
      slide.companions.forEach((path) =>
        string(path, 4096, `${at}.companions`),
      );
    }
    if (slide.continuation !== undefined)
      captions(
        object(
          slide.continuation,
          ["title", "subtitle", "translations"],
          `${at}.continuation`,
        ),
        `${at}.continuation`,
      );
    if (slide.style !== undefined)
      object(
        slide.style,
        [
          "background",
          "backgroundEnd",
          "backgroundMode",
          "textColor",
          "accentColor",
          "titleFont",
          "bodyFont",
          "titleSize",
          "align",
          "texture",
          "accentTitle",
          "fit",
          "frame",
          "camera",
          "deviceOrientation",
        ],
        `${at}.style`,
      );
  });
  return raw as unknown as DesignSpec;
}
export function specImagePaths(spec: DesignSpec) {
  return [
    ...new Set(spec.slides.flatMap((s) => [s.image, ...(s.companions ?? [])])),
  ];
}
export function buildDesign(
  spec: DesignSpec,
  assets: ReadonlyMap<string, Asset>,
  brand?: BrandKit,
): Project {
  const project = createProject(spec.name);
  project.exportProfile = spec.profile;
  if (spec.customSize) project.customSize = { ...spec.customSize };
  const profile = resolveExportProfile(project);
  if (profile.sourceOnly)
    throw new Error(
      "Source-only Wear OS exports are not supported by plugin v0.1. Use the web studio.",
    );
  if (spec.customSize) {
    validateCustomSize(spec.customSize);
    project.customSize = { ...spec.customSize };
  }
  const words: [Shot, Captions][] = [];
  const asset = (path: string) => {
    const found = assets.get(path);
    if (!found) throw new Error(`Missing image: ${path}`);
    return found;
  };
  for (const slide of spec.slides) {
    const id =
      slide.template ??
      spec.template ??
      (isBannerProfile(spec.profile) ? "banner-signal" : "studio");
    if (![...templates, ...bannerTemplates].some((t) => t.id === id))
      throw new Error(`Unknown template: ${id}. Run hen templates.`);
    const template = getTemplate(id);
    if (isBannerProfile(spec.profile) !== template.id.startsWith("banner-"))
      throw new Error(
        "Banner profiles need a banner template; screenshot profiles need a screenshot template.",
      );
    const shot = createShot(asset(slide.image).id, project.shots.length);
    shot.style.device =
      slide.device ??
      spec.device ??
      (profile.category === "tablet"
        ? profile.store === "apple"
          ? "ipad"
          : "android-tablet"
        : profile.category === "desktop"
          ? "monitor"
          : profile.store === "apple"
            ? "ios"
            : "android");
    project.shots.push(shot);
    applyTemplate(project, shot.id, template.id);
    const targets = panoramaPair(project, shot.id) ?? [
      project.shots.find((s) => s.id === shot.id)!,
    ];
    if (isPanoramaTemplate(template.id) !== Boolean(slide.continuation))
      throw new Error(
        "A panorama needs continuation captions for its second slide. Use continuation only with panorama templates.",
      );
    const companions = targets[0].companions ?? [];
    if (companions.length !== (slide.companions?.length ?? 0))
      throw new Error(
        `Template ${id} needs ${companions.length} companion image(s).`,
      );
    companions.forEach((device, i) => {
      device.assetId = asset(slide.companions![i]).id;
    });
    targets.forEach((target, index) => {
      const text = index ? slide.continuation! : slide;
      target.title = text.title;
      target.subtitle = text.subtitle ?? "";
      Object.assign(target.style, slide.style);
      resetComposition(project, target);
      if (slide.placement) target.phone = { ...slide.placement };
      if (slide.textOffsets)
        target.textOffsets = structuredClone(slide.textOffsets);
      words.push([target, text]);
    });
  }
  if (brand) applyBrandKit(project, brand, undefined, true);
  const source = spec.sourceLanguage ?? "en";
  const targets = [
    ...new Set(
      words.flatMap(([, text]) => Object.keys(text.translations ?? {})),
    ),
  ];
  for (const language of targets) {
    addLanguage(project, source, language);
    for (const [shot, text] of words) {
      const translated = text.translations?.[language];
      if (!translated)
        throw new Error(
          `Provide ${language} captions for every slide, including panorama continuations.`,
        );
      writeText(shot, language, "title", translated.title);
      writeText(shot, language, "subtitle", translated.subtitle ?? "");
    }
  }
  if (!project.localization) project.localization = { source, targets: [] };
  if (project.shots.length > profile.maxCount)
    throw new Error(
      `This profile allows ${profile.maxCount} slides per language; the design contains ${project.shots.length}.`,
    );
  validateProject(project);
  return project;
}
