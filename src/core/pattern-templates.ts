import type { Template } from "./templates";
import { defineTemplate } from "./showcase-templates";

export type PatternComposition =
  | "right-low"
  | "left-high"
  | "left-middle"
  | "right-high"
  | "diagonal-center"
  | "left-low"
  | "raised-center"
  | "diagonal-low";

export const patternTemplates: readonly Template[] = [
  defineTemplate(
    {
      id: "zest",
      name: "Zest",
      category: "Bold",
      appearance: "colorful",
      composition: "right-low",
      surfaceLabel: "Citrus stripes",
      keywords: [
        "yellow",
        "citrus",
        "green",
        "stripes",
        "right",
        "tilted",
        "pattern",
      ],
      description: "Citrus color. An off-center point of view.",
      note: "Broad stripes carry a tilted device toward the lower right, with room for a headline and a separate side caption.",
    },
    ["#F5ECA9", "#DED36F", "#293F2C", "#778544"],
    { rotation: -12, size: 120 },
  ),
  defineTemplate(
    {
      id: "cabana",
      name: "Cabana",
      category: "Minimal",
      appearance: "colorful",
      composition: "left-high",
      surfaceLabel: "Awning stripes",
      keywords: [
        "aqua",
        "teal",
        "cream",
        "stripes",
        "left",
        "upper",
        "pattern",
      ],
      description: "A little coastal rhythm. Your app up front.",
      note: "A raised device sits to the left of a striped awning, with the headline tucked into the lower right.",
    },
    ["#E8F3E9", "#B4D5CA", "#234F4B", "#6F9D8E"],
    { rotation: 8, size: 108 },
  ),
  defineTemplate(
    {
      id: "contour",
      name: "Contour",
      category: "Editorial",
      appearance: "dark",
      composition: "left-middle",
      surfaceLabel: "Topographic lines",
      keywords: [
        "dark",
        "petrol",
        "teal",
        "topographic",
        "contours",
        "left",
        "pattern",
      ],
      titleFont: "Fraunces",
      titleWeight: "600",
      description: "Find a new angle in the details.",
      note: "Fine topographic curves follow a device on the left, balanced by an elevated serif headline and a side caption.",
    },
    ["#173E40", "#285858", "#F0ECD5", "#83ACA0"],
    { rotation: -9, size: 112 },
  ),
  defineTemplate(
    {
      id: "cherry",
      name: "Cherry",
      category: "Bold",
      appearance: "colorful",
      composition: "right-high",
      surfaceLabel: "Cherry checkerboard",
      keywords: [
        "red",
        "pink",
        "checker",
        "checkerboard",
        "damier",
        "right",
        "upper",
        "pattern",
      ],
      description: "A bright check. A confident entrance.",
      note: "Cherry checks border a high, right-aligned device. A generous caption below finishes the composition.",
    },
    ["#F9E0DE", "#E6ABA8", "#762F39", "#BE5964"],
    { rotation: -5, size: 120 },
  ),
  defineTemplate(
    {
      id: "terracotta",
      name: "Terracotta",
      category: "Editorial",
      appearance: "light",
      composition: "diagonal-center",
      surfaceLabel: "Clay fans",
      keywords: [
        "clay",
        "orange",
        "sand",
        "fans",
        "arcs",
        "diagonal",
        "pattern",
      ],
      titleFont: "Fraunces",
      titleWeight: "600",
      description: "Warm clay. A bolder angle.",
      note: "Sculpted fan patterns surround a diagonal device, framed by a serif headline above and supporting text below.",
    },
    ["#F2DDCA", "#D9A082", "#583A30", "#B27053"],
    { rotation: 20, size: 116 },
  ),
  defineTemplate(
    {
      id: "blueprint",
      name: "Blueprint",
      category: "Bold",
      appearance: "dark",
      composition: "left-low",
      surfaceLabel: "Drafting marks",
      keywords: [
        "dark",
        "cobalt",
        "blue",
        "grid",
        "drafting",
        "technical",
        "left",
        "lower",
        "pattern",
      ],
      description: "Make your next idea look ready.",
      note: "A low, left-aligned device sits on a cobalt drafting grid, with fine dimension marks and open space for your message.",
    },
    ["#203F82", "#2A5198", "#F3EEDA", "#9AB9E0"],
    { size: 112 },
  ),
  defineTemplate(
    {
      id: "stitch",
      name: "Stitch",
      category: "Minimal",
      appearance: "colorful",
      composition: "raised-center",
      surfaceLabel: "Woven zigzags",
      keywords: [
        "lilac",
        "lavender",
        "purple",
        "zigzag",
        "woven",
        "stitch",
        "upper",
        "pattern",
      ],
      description: "Soft color, with a thread of character.",
      note: "A raised device floats between woven zigzag borders. A lower headline and separate supporting caption keep the story balanced.",
    },
    ["#ECE5F1", "#D4C3DD", "#483653", "#947AA7"],
    { rotation: 4, size: 110 },
  ),
  defineTemplate(
    {
      id: "parade",
      name: "Parade",
      category: "Bold",
      appearance: "dark",
      composition: "diagonal-low",
      surfaceLabel: "Scalloped bands",
      keywords: [
        "dark",
        "burgundy",
        "rose",
        "pink",
        "scallops",
        "bands",
        "diagonal",
        "pattern",
      ],
      description: "A little movement. A memorable launch.",
      note: "Rose-colored scalloped bands run behind a steeply tilted device, with a top headline and a caption in the opposite corner.",
    },
    ["#4A2439", "#773A56", "#FAE7D8", "#C48092"],
    { rotation: -19, size: 120 },
  ),
];

/** Separate regions keep the asymmetry intentional at store and portfolio ratios. */
export function patternAreas(composition: Template["composition"], h: number) {
  const rect = (x: number, y: number, width: number, height: number) => ({
    x,
    y: h * y,
    width,
    height: h * height,
  });
  const wide = h <= 1080;
  switch (composition) {
    case "right-low":
      return wide
        ? {
            title: rect(60, 0.07, 310, 0.39),
            subtitle: rect(64, 0.64, 306, 0.22),
            area: rect(430, 0.12, 590, 0.83),
          }
        : {
            title: rect(72, 0.055, 760, 0.23),
            subtitle: rect(76, 0.37, 270, 0.15),
            area: rect(390, 0.33, 640, 0.63),
          };
    case "left-high":
      return wide
        ? {
            title: rect(650, 0.2, 370, 0.33),
            subtitle: rect(654, 0.72, 366, 0.17),
            area: rect(52, 0.06, 535, 0.85),
          }
        : {
            title: rect(345, 0.755, 675, 0.155),
            subtitle: rect(349, 0.93, 671, 0.045),
            area: rect(48, 0.035, 780, 0.66),
          };
    case "left-middle":
      return wide
        ? {
            title: rect(725, 0.1, 295, 0.37),
            subtitle: rect(730, 0.67, 290, 0.2),
            area: rect(52, 0.08, 605, 0.85),
          }
        : {
            title: rect(310, 0.05, 710, 0.185),
            subtitle: rect(768, 0.47, 252, 0.16),
            area: rect(42, 0.29, 655, 0.665),
          };
    case "right-high":
      return wide
        ? {
            title: rect(64, 0.22, 330, 0.38),
            subtitle: rect(68, 0.76, 326, 0.16),
            area: rect(475, 0.045, 550, 0.84),
          }
        : {
            title: rect(64, 0.76, 952, 0.14),
            subtitle: rect(68, 0.93, 948, 0.045),
            area: rect(248, 0.025, 780, 0.68),
          };
    case "diagonal-center":
      return wide
        ? {
            title: rect(56, 0.12, 260, 0.39),
            subtitle: rect(60, 0.69, 256, 0.23),
            area: rect(365, 0.075, 660, 0.85),
          }
        : {
            title: rect(64, 0.055, 952, 0.155),
            subtitle: rect(68, 0.895, 944, 0.06),
            area: rect(48, 0.27, 984, 0.555),
          };
    case "left-low":
      return wide
        ? {
            title: rect(730, 0.09, 290, 0.36),
            subtitle: rect(734, 0.7, 286, 0.2),
            area: rect(48, 0.17, 615, 0.76),
          }
        : {
            title: rect(72, 0.055, 944, 0.16),
            subtitle: rect(710, 0.245, 306, 0.085),
            area: rect(48, 0.35, 790, 0.6),
          };
    case "raised-center":
      return wide
        ? {
            title: rect(60, 0.1, 320, 0.39),
            subtitle: rect(64, 0.85, 952, 0.1),
            area: rect(448, 0.045, 575, 0.75),
          }
        : {
            title: rect(64, 0.75, 652, 0.16),
            subtitle: rect(776, 0.765, 244, 0.145),
            area: rect(215, 0.065, 650, 0.605),
          };
    case "diagonal-low":
      return wide
        ? {
            title: rect(64, 0.035, 950, 0.14),
            subtitle: rect(625, 0.855, 395, 0.11),
            area: rect(58, 0.25, 958, 0.54),
          }
        : {
            title: rect(64, 0.045, 810, 0.18),
            subtitle: rect(625, 0.87, 391, 0.09),
            area: rect(48, 0.285, 960, 0.53),
          };
    default:
      return undefined;
  }
}
