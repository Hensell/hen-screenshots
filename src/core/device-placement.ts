import { PLACEMENT_LIMITS, type Shot, type Style } from "./model";
import { deviceGeometry } from "../rendering/geometry";

export type DevicePlacement = Pick<Shot["phone"], "x" | "y" | "width"> &
  Partial<Pick<Shot["phone"], "rotation">>;

/** A complete turn has the same persisted angle, regardless of drag direction. */
export function normalizeDeviceRotation(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

/** Canvas gestures commit one bounded placement without changing image or text. */
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
  if (placement.rotation !== undefined)
    shot.phone.rotation = normalizeDeviceRotation(placement.rotation);
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
