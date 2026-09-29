import { defineTemplate } from "./showcase-templates";
import type { Template } from "./templates";

/** Explicit hardware presets; other single-device templates keep the user's frame. */
export const portfolioTemplates: readonly Template[] = [
  {
    id: "portfolio-laptop",
    name: "Laptop Studio",
    device: "laptop",
    appearance: "light",
    colors: ["#ECEFEA", "#D7DED4", "#2C382E", "#72856C"],
    description: "A spacious laptop cover for your next case study.",
  },
  {
    id: "portfolio-monitor",
    name: "Monitor Gallery",
    device: "monitor",
    appearance: "light",
    colors: ["#F4EDE3", "#E6D8C7", "#43382C", "#A1805F"],
    description: "A desktop centerpiece on a warm gallery wall.",
  },
  {
    id: "portfolio-laptop-editorial",
    name: "Laptop Editorial",
    device: "laptop",
    appearance: "light",
    colors: ["#F2ECE0", "#E2D7C5", "#3C352E", "#987352"],
    description: "Warm paper, a serif headline, and your work on a laptop.",
  },
  {
    id: "portfolio-monitor-dark",
    name: "Monitor Focus",
    device: "monitor",
    appearance: "dark",
    colors: ["#232C30", "#344248", "#F0EDE4", "#97B6B8"],
    description: "A quiet dark stage for detailed desktop interfaces.",
  },
].map((design) => {
  const template = defineTemplate(
    {
      id: design.id as Template["id"],
      name: design.name,
      category:
        design.id === "portfolio-laptop-editorial" ? "Editorial" : "Minimal",
      appearance: design.appearance as Template["appearance"],
      composition: "desk",
      description: design.description,
      note: "Sets up a landscape hardware frame with a large screenshot area, a headline above, and a caption below. Your text and image are preserved.",
      surfaceLabel:
        design.device === "laptop" ? "Laptop showcase" : "Monitor showcase",
      keywords: [
        "portfolio",
        "case study",
        "desktop",
        "web",
        "website",
        "hardware",
        "laptop",
        "monitor",
        "portafolio",
        "computadora",
        design.device,
      ],
      ...(design.id === "portfolio-laptop-editorial"
        ? { titleFont: "Fraunces" as const, titleWeight: "600" }
        : {}),
    },
    design.colors as [string, string, string, string],
    { size: 100 },
  );
  return {
    ...template,
    style: {
      ...template.style,
      device: design.device as "laptop" | "monitor",
      deviceOrientation: "landscape",
      frame: true,
      camera: false,
      fit: "contain",
    },
  };
});
