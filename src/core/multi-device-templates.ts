import { defineTemplate } from "./showcase-templates";
import { deviceCompositions, type CompositionId } from "./device-composition";
import type { Template } from "./templates";

const designs: {
  id: CompositionId;
  name: string;
  appearance: "light" | "dark" | "colorful";
  colors: [string, string, string, string];
  description: string;
  category: Template["category"];
}[] = [
  {
    id: "sidekick",
    name: "Sidekick",
    appearance: "light",
    colors: ["#F4EDDF", "#E1D1B4", "#302B24", "#987044"],
    description: "Your desktop app. Its pocket-sized companion.",
    category: "Minimal",
  },
  {
    id: "handoff",
    name: "Handoff",
    appearance: "dark",
    colors: ["#18283B", "#29475B", "#F0F4EC", "#8CBABD"],
    description: "From the big screen to the palm of your hand.",
    category: "Bold",
  },
  {
    id: "companion",
    name: "Companion",
    appearance: "light",
    colors: ["#EEE9F3", "#D8CEE5", "#3D304A", "#8B6DA1"],
    description: "Two ways to carry your best ideas.",
    category: "Minimal",
  },
  {
    id: "duet",
    name: "Duet",
    appearance: "colorful",
    colors: ["#FAE4DA", "#E9B1A0", "#4F2F30", "#B7594B"],
    description: "A phone and a tablet, perfectly in tune.",
    category: "Bold",
  },
  {
    id: "workspace",
    name: "Workspace",
    appearance: "light",
    colors: ["#E8EBDD", "#CDD6BF", "#303C2F", "#718565"],
    description: "Room to create. Space to explore.",
    category: "Editorial",
  },
  {
    id: "desktop-suite",
    name: "Desktop Suite",
    appearance: "dark",
    colors: ["#272B2B", "#3C4542", "#F1EFE3", "#B9BE99"],
    description: "A complete workspace, across two screens.",
    category: "Editorial",
  },
  {
    id: "ecosystem",
    name: "Ecosystem",
    appearance: "light",
    colors: ["#F6F0E5", "#E4D4BE", "#37312D", "#B08864"],
    description: "One app. Every screen. All together.",
    category: "Editorial",
  },
  {
    id: "constellation",
    name: "Constellation",
    appearance: "dark",
    colors: ["#222239", "#3D3B5C", "#F3EEF9", "#B5A5D1"],
    description: "Your whole product, in one connected scene.",
    category: "Bold",
  },
];
export const multiDeviceTemplates: readonly Template[] = designs.map((design) =>
  defineTemplate(
    {
      id: design.id,
      name: design.name,
      appearance: design.appearance,
      category: design.category,
      description: design.description,
      note: "Each device has its own screenshot, frame, size, and position. Select a device to make it yours.",
      surfaceLabel: "Device stage",
      keywords: [
        "multiple devices",
        "responsive",
        "cross-platform",
        "combined",
        ...deviceCompositions[design.id].flatMap((device) =>
          device === "ios" || device === "android"
            ? ["mobile", "phone"]
            : device === "ipad" || device === "android-tablet"
              ? ["tablet"]
              : ["desktop", device],
        ),
        ...(deviceCompositions[design.id].length === 3
          ? ["trio", "three devices"]
          : ["duo", "two devices"]),
      ],
    },
    design.colors,
    { size: 112 },
  ),
);
