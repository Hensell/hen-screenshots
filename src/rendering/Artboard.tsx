import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { errorMessage } from "../core/model";
import type { Project, Shot, TextElement, CanvasElement } from "../core/model";
import { textOffset } from "../core/text-placement";
import { ensureSceneFonts } from "./fonts";
import { previewDimensions } from "./geometry";
import { canonicalCanvas } from "../core/export-profiles";
import { createScene, selectSceneElement } from "./scene";

export interface ArtboardProps {
  project: Project;
  shot: Shot;
  image: HTMLImageElement;
  width: number;
  onMove?: (x: number, y: number) => void;
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
  width,
  onMove,
  onTextMove,
  onSelectElement,
}: ArtboardProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const selectedElement = useRef<CanvasElement>("device");
  const layerRef = useRef<Konva.Layer | null>(null);
  const selectedShotId = useRef(shot.id);
  const [selectedLabel, setSelectedLabel] = useState("Device");
  const editable = Boolean(onMove || onTextMove);
  const selectionCallback = useRef(onSelectElement);
  selectionCallback.current = onSelectElement;
  function selectElement(
    element: CanvasElement,
    ownerId = shot.id,
    notify = true,
  ) {
    selectedElement.current = element;
    selectedShotId.current = ownerId;
    setSelectedLabel(
      element === "title"
        ? "Headline"
        : element === "subtitle"
          ? "Supporting text"
          : "Device",
    );
    if (layerRef.current)
      selectSceneElement(layerRef.current, element, ownerId);
    if (notify) selectionCallback.current?.(element, ownerId);
  }
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
          onMove,
          onTextMove,
          onSelectElement: selectElement,
        });
        stage.add(layer);
        layerRef.current = layer;
        if (
          selectedElement.current !== "device" &&
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
  }, [project, shot, image, width, onMove, onTextMove]);

  return (
    <div
      role="group"
      aria-label={`Screenshot preview: ${shot.title || "Untitled screenshot"}`}
      aria-description={
        editable
          ? `${selectedLabel} selected. Drag the device or text. Enter switches objects. Arrow keys move the selected object. Hold Shift for larger steps.`
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
                ?.find(".selection-outline")
                .forEach((node) => node.hide())
          : undefined
      }
      onKeyDown={
        editable
          ? (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const elements: CanvasElement[] = [
                  "device",
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
              if (element === "device")
                onMove?.(
                  shot.phone.x + direction[0] * step,
                  shot.phone.y + direction[1] * step,
                );
              else {
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
          {error}
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
          Preparing preview…
        </div>
      )}
    </div>
  );
}
