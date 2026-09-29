import { resolveStyle, type Project, type Shot, type Style } from "./model";
import { linkedShots } from "./panorama";
import { templateLayout, supportingTextSize } from "./templates";

export type StylePasteMode = "all" | "colors" | "typography";
export interface CopiedStyle {
  style: Omit<Style, "template">;
}
const colorKeys = [
  "background",
  "backgroundEnd",
  "backgroundMode",
  "textColor",
  "accentColor",
] as const;
const typographyKeys = [
  "titleFont",
  "bodyFont",
  "titleWeight",
  "bodyWeight",
  "titleScale",
  "titleLineHeight",
  "subtitleOpacity",
  "titleSize",
  "subtitleSize",
  "align",
  "accentTitle",
] as const;

/** Freeze template defaults too, so pasting does not inherit the target's typography. */
export function copyShotStyle(project: Project, shot: Shot): CopiedStyle {
  const { template: templateId, ...style } = resolveStyle(project, shot);
  const template = templateLayout(project, { ...style, template: templateId });
  return {
    style: {
      ...style,
      titleFont: style.titleFont ?? template.titleFont ?? "Manrope",
      bodyFont: style.bodyFont ?? "Manrope",
      titleWeight:
        style.titleWeight ??
        (style.titleFont
          ? style.titleFont === "Fraunces"
            ? "600"
            : "800"
          : (template.titleWeight ??
            (templateId === "classic" ? "700" : "800"))),
      bodyWeight:
        style.bodyWeight ?? (style.bodyFont === "Fraunces" ? "600" : "400"),
      titleScale: style.titleScale ?? template.fontScale,
      titleLineHeight: style.titleLineHeight ?? template.lineHeight,
      subtitleOpacity:
        style.subtitleOpacity ?? (templateId === "classic" ? 0.78 : 0.88),
      subtitleSize: supportingTextSize(project, {
        ...style,
        template: templateId,
      }),
    },
  };
}

/** Pasting never changes authored content, template or geometry. Linked pairs stay consistent. */
export function pasteShotStyle(
  project: Project,
  shotId: string,
  copied: CopiedStyle,
  mode: StylePasteMode,
): void {
  const patch =
    mode === "all"
      ? copied.style
      : Object.fromEntries(
          (mode === "colors" ? colorKeys : typographyKeys).map((key) => [
            key,
            copied.style[key],
          ]),
        );
  for (const target of linkedShots(project, shotId))
    Object.assign(target.style, patch);
}
