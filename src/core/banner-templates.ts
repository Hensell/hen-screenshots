import type { Project, Style, TemplateId } from "./model";
import type { Template } from "./templates";
import { defineTemplate } from "./showcase-templates";
import { canonicalCanvas } from "./export-profiles";

export const bannerTemplates: readonly Template[] = [
  defineTemplate(
    {
      id: "banner-signal",
      name: "Signal",
      category: "Minimal",
      appearance: "light",
      surfaceLabel: "Soft stage",
      description: "Your artwork, with room for a clear message.",
      note: "A calm sage stage holds your icon or illustration beside a generous headline.",
      keywords: ["banner", "green", "sage", "minimal", "icon"],
    },
    ["#E6EDDF", "#CFDDBF", "#283E30", "#7F9766"],
    { size: 74 },
  ),
  defineTemplate(
    {
      id: "banner-orbit",
      name: "Brand Orbit",
      category: "Bold",
      appearance: "dark",
      surfaceLabel: "Orbital rings",
      description: "A small world built around your app.",
      note: "Fine orbital rings surround your artwork on deep blue, with a clear message alongside.",
      keywords: ["banner", "dark", "blue", "rings", "icon"],
    },
    ["#223E59", "#305570", "#FAEEDA", "#9DBFBF"],
    { size: 78 },
  ),
  defineTemplate(
    {
      id: "banner-editorial",
      name: "Wordmark",
      category: "Editorial",
      appearance: "light",
      titleFont: "Fraunces",
      titleWeight: "600",
      surfaceLabel: "Editorial rule",
      description: "A considered headline. Your brand alongside.",
      note: "A serif headline and fine rules balance an image on a warm paper backdrop.",
      keywords: ["banner", "serif", "cream", "editorial", "logo"],
    },
    ["#F5EBDB", "#E3D3B9", "#583D31", "#A67555"],
    { size: 78 },
  ),
  defineTemplate(
    {
      id: "banner-ribbon",
      name: "Coral Ribbon",
      category: "Bold",
      appearance: "colorful",
      surfaceLabel: "Color ribbon",
      description: "An open canvas with a confident sweep of color.",
      note: "A broad coral ribbon carries your artwork, with the text balanced on the opposite side.",
      keywords: ["banner", "coral", "orange", "ribbon"],
    },
    ["#F8E1CE", "#E8AC91", "#713A32", "#C37159"],
    { size: 76 },
  ),
  defineTemplate(
    {
      id: "banner-dusk",
      name: "Dusk",
      category: "Editorial",
      appearance: "dark",
      titleFont: "Fraunces",
      titleWeight: "600",
      surfaceLabel: "Evening arch",
      description: "Rich plum, soft shapes, and your story.",
      note: "An evening arch highlights your illustration. A serif headline sits alongside on a deep plum backdrop.",
      keywords: ["banner", "dark", "plum", "arch", "serif"],
    },
    ["#493344", "#72546C", "#F9ECDD", "#C7A98F"],
    { size: 78 },
  ),
  defineTemplate(
    {
      id: "banner-confetti",
      name: "Paper Parade",
      category: "Bold",
      appearance: "colorful",
      surfaceLabel: "Paper shapes",
      description: "A playful first impression, in paper and color.",
      note: "Large paper shapes add rhythm around your artwork while leaving the headline clear.",
      keywords: ["banner", "yellow", "paper", "shapes", "playful"],
    },
    ["#F5EDBA", "#DED496", "#404C39", "#8E9C71"],
    { size: 76 },
  ),
];
export function isBannerTemplate(id: TemplateId): boolean {
  return bannerTemplates.some((template) => template.id === id);
}

/** Central margins are an editorial guide, not a promise about every Play placement. */
export function bannerLayout(project: Project, style: Style) {
  const h = canonicalCanvas(project).height;
  const artworkLeft =
    style.template === "banner-ribbon" || style.template === "banner-dusk";
  const panel = {
    x: artworkLeft ? 110 : 600,
    y: h * 0.15,
    width: 370,
    height: h * 0.7,
  };
  const width = Math.min(panel.width, panel.height / 0.75) * 0.82;
  const textX = artworkLeft ? 540 : 110;
  return {
    phone: {
      x: panel.x + (panel.width - width) / 2,
      y: panel.y + (panel.height - width * 0.75) / 2,
      width,
      rotation: 0,
    },
    title: { x: textX, y: h * 0.23, width: 430, height: h * 0.34 },
    subtitle: { x: textX + 2, y: h * 0.66, width: 408, height: h * 0.13 },
    panel,
    fontScale: 1,
    subtitleSize: 24,
  };
}
