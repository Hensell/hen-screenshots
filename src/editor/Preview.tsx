import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from "react";
import type { Project, Shot } from "../core/model";
import { canonicalCanvas } from "../core/export-profiles";
import { Artboard } from "../rendering/Artboard";

export function Preview({
  project,
  shot,
  image,
  onMove,
  small = false,
  onContextMenu,
  onKeyDown,
}: {
  project: Project;
  shot: Shot;
  image?: HTMLImageElement;
  onMove?: (x: number, y: number) => void;
  small?: boolean;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}) {
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
      role="img"
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
      aria-label={`${shot.title.replace(/\n/g, " ")} — ${shot.subtitle}`}
    >
      {width > 0 && image ? (
        <Artboard
          project={project}
          shot={shot}
          image={image}
          width={width}
          onMove={onMove}
        />
      ) : (
        <div className="preview-loading">
          {small ? "" : "Loading screenshot…"}
        </div>
      )}
    </div>
  );
}
