import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { errorMessage } from "../core/model";
import type { Project, Shot } from "../core/model";
import { ensureManrope } from "./fonts";
import { previewDimensions } from "./geometry";
import { canonicalCanvas } from "../core/export-profiles";
import { createScene } from "./scene";

export interface ArtboardProps {
  project: Project;
  shot: Shot;
  image: HTMLImageElement;
  width: number;
  onMove?: (x: number, y: number) => void;
}

export function Artboard({
  project,
  shot,
  image,
  width,
  onMove,
}: ArtboardProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const dimensions = previewDimensions(width, canonicalCanvas(project));

  useEffect(() => {
    let disposed = false;
    let stage: Konva.Stage | undefined;
    setError(null);
    setReady(false);
    void ensureManrope()
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
        stage.add(createScene(project, shot, image, { onMove }));
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
    };
  }, [project, shot, image, width, onMove]);

  return (
    <div
      role="group"
      aria-label={`Screenshot preview: ${shot.title || "Untitled screenshot"}`}
      aria-description={
        onMove
          ? "Drag the device to move it, or use arrow keys. Hold Shift for larger steps."
          : undefined
      }
      aria-busy={!ready && !error}
      tabIndex={onMove ? 0 : undefined}
      onKeyDown={
        onMove
          ? (event) => {
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
              onMove(
                shot.phone.x + direction[0] * step,
                shot.phone.y + direction[1] * step,
              );
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
