import {
  isOverlayElement,
  overlayFor,
  resizeOverlay,
  type OverlayChange,
} from "../core/overlays";
import type { OverlayElement } from "../core/model";
import {
  companionFor,
  deviceShot,
  isDeviceElement,
} from "../core/device-composition";
import type { DeviceElement } from "../core/model";
import { useT } from "../i18n/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Konva from "konva";
import { errorMessage, resolveStyle } from "../core/model";
import { resizeDevice, type DevicePlacement } from "../core/device-placement";
import type { Project, Shot, TextElement, CanvasElement } from "../core/model";
import { textOffset } from "../core/text-placement";
import { ensureSceneFonts } from "./fonts";
import { previewDimensions } from "./geometry";
import { canonicalCanvas } from "../core/export-profiles";
import { linkedShots } from "../core/panorama";
import { createScene, selectSceneElement } from "./scene";

export interface ArtboardProps {
  project: Project;
  shot: Shot;
  image: HTMLImageElement;
  images?: ReadonlyMap<string, HTMLImageElement>;
  activeDevice?: DeviceElement | OverlayElement | null;
  activeOwnerId?: string;
  onOverlayChange?: OverlayChange;
  width: number;
  guides?: boolean;
  onMove?: (x: number, y: number, element?: DeviceElement) => void;
  onResize?: (
    placement: DevicePlacement,
    shotId: string,
    element?: DeviceElement,
  ) => void;
  onSelectElement?: (element: CanvasElement, shotId: string) => void;
  onTextMove?: (
    element: TextElement,
    x: number,
    y: number,
    shotId: string,
  ) => void;
}

export function Artboard({
  project,
  shot,
  image,
  images,
  activeDevice,
  activeOwnerId,
  width,
  guides = false,
  onMove,
  onResize,
  onTextMove,
  onSelectElement,
  onOverlayChange,
}: ArtboardProps) {
  const t = useT();
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const selectedElement = useRef<CanvasElement>("device");
  const layerRef = useRef<Konva.Layer | null>(null);
  const selectedShotId = useRef(shot.id);
  const [selectedLabel, setSelectedLabel] = useState("Device");
  const editable = Boolean(onMove || onTextMove || onResize);
  const selectionCallback = useRef(onSelectElement);
  useLayoutEffect(() => {
    selectionCallback.current = onSelectElement;
  }, [onSelectElement]);
  const selectElement = useCallback(
    (element: CanvasElement, ownerId = shot.id, notify = true) => {
      selectedElement.current = element;
      selectedShotId.current = ownerId;
      setSelectedLabel(
        element === "title"
          ? "Headline"
          : element === "subtitle"
            ? "Supporting text"
            : isOverlayElement(element)
              ? "Extra image"
              : "Device",
      );
      if (layerRef.current)
        selectSceneElement(layerRef.current, element, ownerId);
      if (notify) selectionCallback.current?.(element, ownerId);
    },
    [shot.id],
  );
  // Inspector device selection must not overwrite the owner of a caption crossing a panorama seam.
  useEffect(() => {
    if (activeDevice && isOverlayElement(activeDevice)) {
      const owner = linkedShots(project, shot.id).find(
        (item) => item.id === (activeOwnerId ?? shot.id),
      );
      selectElement(
        owner && overlayFor(owner, activeDevice) ? activeDevice : "device",
        owner?.id ?? shot.id,
        false,
      );
      return;
    }
    if (activeDevice)
      selectElement(
        isDeviceElement(activeDevice) &&
          activeDevice !== "device" &&
          !companionFor(shot, activeDevice)
          ? "device"
          : activeDevice,
        shot.id,
        false,
      );
  }, [activeDevice, activeOwnerId, project, shot, selectElement]);
  const dimensions = previewDimensions(width, canonicalCanvas(project));

  useEffect(() => {
    let disposed = false;
    let stage: Konva.Stage | undefined;
    setError(null);
    setReady(false);
    void ensureSceneFonts(project, shot)
      .then(() => {
        if (disposed || !container.current) return;
        const size = previewDimensions(width, canonicalCanvas(project));
        stage = new Konva.Stage({
          container: container.current,
          width: size.width,
          height: size.height,
          scaleX: size.scale,
          scaleY: size.scale,
        });
        const layer = createScene(project, shot, image, {
          images,
          guides,
          onMove,
          onResize,
          onTextMove,
          onOverlayChange,
          onSelectElement: selectElement,
        });
        stage.add(layer);
        layerRef.current = layer;
        const owner = project.shots.find(
          (item) => item.id === selectedShotId.current,
        );
        if (
          isOverlayElement(selectedElement.current) &&
          (!owner || !overlayFor(owner, selectedElement.current))
        )
          selectElement("device", shot.id, false);
        if (
          (selectedElement.current === "title" ||
            selectedElement.current === "subtitle") &&
          !project.shots
            .find((owner) => owner.id === selectedShotId.current)
            ?.[selectedElement.current].trim()
        )
          selectElement("device", shot.id, false);
        if (container.current.parentElement === document.activeElement)
          selectSceneElement(
            layer,
            selectedElement.current,
            selectedShotId.current,
          );
        stage.draw();
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (disposed) return;
        stage?.destroy();
        setError(errorMessage(cause));
      });
    return () => {
      disposed = true;
      stage?.destroy();
      layerRef.current = null;
    };
  }, [
    project,
    shot,
    image,
    images,
    width,
    onMove,
    onResize,
    onTextMove,
    onOverlayChange,
    guides,
    selectElement,
  ]);

  return (
    <div
      role="group"
      aria-label={t("Screenshot preview: {title}", {
        title: shot.title || t("Untitled screenshot"),
      })}
      aria-description={
        editable
          ? t(
              "{element} selected. Drag to move. Drag a device or image corner to resize. Enter switches objects. Arrow keys move the selected object. Plus and minus resize devices and images. Hold Shift for larger steps.",
              { element: t(selectedLabel) },
            )
          : undefined
      }
      aria-busy={!ready && !error}
      tabIndex={editable ? 0 : undefined}
      onFocus={
        editable
          ? () =>
              selectElement(
                selectedElement.current,
                selectedShotId.current,
                false,
              )
          : undefined
      }
      onBlur={
        editable
          ? () =>
              layerRef.current
                ?.find(".selection-outline, .device-transformer")
                .forEach((node) => node.hide())
          : undefined
      }
      onKeyDown={
        editable
          ? (event) => {
              if (
                onOverlayChange &&
                isOverlayElement(selectedElement.current) &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                ["+", "=", "-", "_"].includes(event.key)
              ) {
                event.preventDefault();
                const owner =
                  project.shots.find(
                    (item) => item.id === selectedShotId.current,
                  ) ?? shot;
                const overlay = overlayFor(owner, selectedElement.current);
                if (overlay)
                  onOverlayChange(
                    overlay.id,
                    resizeOverlay(
                      overlay,
                      overlay.width +
                        (["-", "_"].includes(event.key) ? -1 : 1) *
                          (event.shiftKey ? 50 : 10),
                    ),
                    owner.id,
                  );
                return;
              }
              if (
                onResize &&
                isDeviceElement(selectedElement.current) &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                ["+", "=", "-", "_"].includes(event.key)
              ) {
                event.preventDefault();
                const slot = deviceShot(shot, selectedElement.current);
                const next = { ...slot, phone: { ...slot.phone } };
                const direction =
                  event.key === "-" || event.key === "_" ? -1 : 1;
                resizeDevice(
                  next,
                  resolveStyle(project, slot),
                  slot.phone.width + direction * (event.shiftKey ? 50 : 10),
                );
                onResize(
                  { x: next.phone.x, y: next.phone.y, width: next.phone.width },
                  shot.id,
                  selectedElement.current,
                );
                return;
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const elements: CanvasElement[] = [
                  "device",
                  ...(shot.companions ?? []).map(
                    (device) => `device:${device.id}` as DeviceElement,
                  ),
                  ...(shot.overlays ?? []).map(
                    (item) => `overlay:${item.id}` as OverlayElement,
                  ),
                  ...(["title", "subtitle"] as const).filter((element) =>
                    shot[element].trim(),
                  ),
                ];
                selectElement(
                  elements[
                    (elements.indexOf(selectedElement.current) + 1) %
                      elements.length
                  ],
                );
                return;
              }
              const directions: Record<string, [number, number]> = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              };
              const direction = directions[event.key];
              if (!direction) return;
              event.preventDefault();
              const step = event.shiftKey ? 10 : 1;
              const element = selectedElement.current;
              if (isDeviceElement(element)) {
                const slot = deviceShot(shot, element);
                onMove?.(
                  slot.phone.x + direction[0] * step,
                  slot.phone.y + direction[1] * step,
                  element,
                );
              } else if (isOverlayElement(element)) {
                const owner =
                  project.shots.find(
                    (item) => item.id === selectedShotId.current,
                  ) ?? shot;
                const overlay = overlayFor(owner, element);
                if (overlay)
                  onOverlayChange?.(
                    overlay.id,
                    {
                      x: overlay.x + direction[0] * step,
                      y: overlay.y + direction[1] * step,
                    },
                    owner.id,
                  );
              } else {
                const owner =
                  project.shots.find(
                    (item) => item.id === selectedShotId.current,
                  ) ?? shot;
                const offset = textOffset(owner, element);
                onTextMove?.(
                  element,
                  offset.x + direction[0] * step,
                  offset.y + direction[1] * step,
                  owner.id,
                );
              }
            }
          : undefined
      }
      style={{
        width: dimensions.width,
        height: dimensions.height,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        ref={container}
        aria-hidden="true"
        style={{ width: "100%", height: "100%" }}
      />
      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "#F4F1E9",
            color: "#693F35",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {t(error)}
        </div>
      )}
      {!ready && !error && (
        <div
          role="status"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "#F4F1E9",
            color: "#66716A",
            fontSize: 12,
          }}
        >
          {t("Preparing preview…")}
        </div>
      )}
    </div>
  );
}
