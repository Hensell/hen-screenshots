import {
  useEffect,
  useRef,
  useState,
  type MouseEventHandler,
  type KeyboardEventHandler,
} from "react";
import type { Project, Shot, TextElement } from "../core/model";
import { canonicalCanvas } from "../core/export-profiles";
import { Artboard } from "../rendering/Artboard";

export function Preview({
  project,
  shot,
  image,
  onMove,
  onTextMove,
  small = false,
  onContextMenu,
  onKeyDown,
}: {
  project: Project;
  shot: Shot;
  image?: HTMLImageElement;
  onMove?: (x: number, y: number) => void;
  onTextMove?: (
    element: TextElement,
    x: number,
    y: number,
    shotId: string,
  ) => void;
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
      role={onMove || onTextMove ? "group" : "img"}
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
          onTextMove={onTextMove}
        />
      ) : (
        <div className="preview-loading">
          {small ? "" : "Loading screenshot…"}
        </div>
      )}
    </div>
  );
}
