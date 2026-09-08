import type { DeviceFamily } from "./model";
export const deviceCompositions = {
  sidekick: ["laptop", "ios"],
  handoff: ["monitor", "android"],
  companion: ["ipad", "ios"],
  duet: ["android-tablet", "android"],
  workspace: ["laptop", "ipad"],
  "desktop-suite": ["monitor", "android-tablet"],
  ecosystem: ["laptop", "ipad", "ios"],
  constellation: ["monitor", "android-tablet", "android"],
} as const satisfies Record<string, readonly DeviceFamily[]>;
export type CompositionId = keyof typeof deviceCompositions;
export const compositionId = (id: string): CompositionId | undefined =>
  Object.hasOwn(deviceCompositions, id) ? (id as CompositionId) : undefined;
