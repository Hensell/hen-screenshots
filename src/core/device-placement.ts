import { PLACEMENT_LIMITS, type Shot, type Style } from "./model";
import { deviceGeometry } from "../rendering/geometry";

export type DevicePlacement = Pick<Shot["phone"], "x" | "y" | "width">;

/** Canvas gestures commit one bounded placement; rotation and content stay unchanged. */
export function setDevicePlacement(
  shot: Shot,
  placement: DevicePlacement,
): void {
  if (!Object.values(placement).every(Number.isFinite)) return;
  for (const key of ["x", "y", "width"] as const) {
    const limits = PLACEMENT_LIMITS[key];
    shot.phone[key] = Math.max(
      limits.min,
      Math.min(limits.max, placement[key]),
    );
  }
}

/** Inspector/keyboard resizing keeps the visual center, including rotated devices. */
export function resizeDevice(
  shot: Shot,
  style: Style,
  requestedWidth: number,
): void {
  if (!Number.isFinite(requestedWidth)) return;
  const width = Math.round(
    Math.max(
      PLACEMENT_LIMITS.width.min,
      Math.min(PLACEMENT_LIMITS.width.max, requestedWidth),
    ),
  );
  const current = deviceGeometry(
    style.device,
    shot.phone.width,
    style.frame,
    style.deviceOrientation,
  );
  const next = deviceGeometry(
    style.device,
    width,
    style.frame,
    style.deviceOrientation,
  );
  setDevicePlacement(shot, {
    x: shot.phone.x + (current.width - next.width) / 2,
    y: shot.phone.y + (current.height - next.height) / 2,
    width,
  });
}
