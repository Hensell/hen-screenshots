import { sceneAssetIds, type OverlayChange } from "../core/overlays";
import type { OverlayElement } from "../core/model";
import type { DeviceElement } from "../core/model";
import { useT } from "../i18n/react";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from "react";
import type { Project, Shot, TextElement, CanvasElement } from "../core/model";
import { canonicalCanvas } from "../core/export-profiles";
import type { DevicePlacement } from "../core/device-placement";
import { RenderBoundary } from "../app/DeferredFeature";
const Artboard = lazy(() =>
  import("../rendering/Artboard").then((module) => ({
    default: module.Artboard,
  })),
);

export function Preview({
  project,
  shot,
  image,
  images,
  activeDevice,
  activeOwnerId,
  onMove,
  onResize,
  onOverlayChange,
  onTextMove,
  onSelectElement,
  small = false,
  showEmptyDevices = true,
  onContextMenu,
  onKeyDown,
  guides = false,
}: {
  project: Project;
  shot: Shot;
  image?: HTMLImageElement;
  images?: ReadonlyMap<string, HTMLImageElement>;
  activeDevice?: DeviceElement | OverlayElement | null;
  activeOwnerId?: string;
  onOverlayChange?: OverlayChange;
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
  small?: boolean;
  showEmptyDevices?: boolean;
  guides?: boolean;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current!;
    const observer = new ResizeObserver(([entry]) =>
      // Adjacent panorama tiles can be half a CSS pixel wide; rounding leaves a visible seam.
      setWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`artboard ${small ? "artboard-small" : ""}`}
      style={{ aspectRatio: `1080 / ${canonicalCanvas(project).height}` }}
      role={onMove || onTextMove || onResize ? "group" : "img"}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      aria-label={
        shot.title || shot.subtitle
          ? [shot.title.replace(/\n/g, " "), shot.subtitle]
              .filter(Boolean)
              .join(" — ")
          : t(shot.assetId === null ? "Empty slide" : "Untitled screenshot")
      }
    >
      {width > 0 &&
      (shot.assetId === null || image) &&
      sceneAssetIds(project, shot).every(
        (id) => id === shot.assetId || images?.has(id),
      ) ? (
        <RenderBoundary
          fallback={
            <p role="alert" className="preview-loading">
              {t(
                "Preview unavailable. Save your project and reload to try again.",
              )}
            </p>
          }
        >
          <Suspense
            fallback={
              <div className="preview-loading" role="status">
                {t("Preparing preview…")}
              </div>
            }
          >
            <Artboard
              project={project}
              shot={shot}
              image={image}
              showEmptyDevices={showEmptyDevices}
              images={images}
              activeDevice={activeDevice}
              activeOwnerId={activeOwnerId}
              width={width}
              guides={guides}
              onMove={onMove}
              onResize={onResize}
              onOverlayChange={onOverlayChange}
              onTextMove={onTextMove}
              onSelectElement={onSelectElement}
            />
          </Suspense>
        </RenderBoundary>
      ) : (
        <div className="preview-loading">
          {small ? "" : t("Loading screenshot…")}
        </div>
      )}
    </div>
  );
}
