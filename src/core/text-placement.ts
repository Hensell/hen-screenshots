import { TEXT_OFFSET_LIMITS, type Shot, type TextElement } from "./model";

export function textOffset(shot: Shot, element: TextElement) {
  return shot.textOffsets?.[element] ?? { x: 0, y: 0 };
}

/** Offsets are local to one slide and relative to its template's text boxes. */
export function moveText(
  shot: Shot,
  element: TextElement,
  x: number,
  y: number,
): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const offset = {
    x: Math.max(
      -TEXT_OFFSET_LIMITS.x,
      Math.min(TEXT_OFFSET_LIMITS.x, Math.round(x)),
    ),
    y: Math.max(
      -TEXT_OFFSET_LIMITS.y,
      Math.min(TEXT_OFFSET_LIMITS.y, Math.round(y)),
    ),
  };
  if (offset.x === 0 && offset.y === 0) resetText(shot, element);
  else shot.textOffsets = { ...shot.textOffsets, [element]: offset };
}

export function resetText(shot: Shot, element?: TextElement): void {
  if (!element) delete shot.textOffsets;
  else if (shot.textOffsets) {
    delete shot.textOffsets[element];
    if (Object.keys(shot.textOffsets).length === 0) delete shot.textOffsets;
  }
}
