import { useEffect, useRef, useState } from "react";
import { Icon } from "../app/Icon";
import { useT } from "../i18n/react";
import type {
  CanvasElement,
  ImageOverlay,
  OverlayElement,
  Project,
  Shot,
} from "../core/model";
import {
  MAX_OVERLAYS,
  overlayFor,
  overlayPlacement,
  removeOverlay,
  reorderOverlay,
  resizeOverlay,
  setOverlayPlacement,
} from "../core/overlays";
import { useEditor } from "./store";
import "./overlays.css";

function Thumbnail({ image }: { image?: HTMLImageElement }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, 48, 48);
    if (image) {
      const scale = Math.min(40 / image.naturalWidth, 40 / image.naturalHeight);
      const w = image.naturalWidth * scale,
        h = image.naturalHeight * scale;
      c.drawImage(image, (48 - w) / 2, (48 - h) / 2, w, h);
    }
  }, [image]);
  return <canvas ref={ref} width={48} height={48} aria-hidden="true" />;
}
export function OverlayInspector({
  project,
  shot,
  images,
  selectedElement,
  onSelect,
  onUpload,
}: {
  project: Project;
  shot: Shot;
  images: ReadonlyMap<string, HTMLImageElement>;
  selectedElement: CanvasElement | null;
  onSelect: (element: OverlayElement) => void;
  onUpload: (replaceId?: string) => void;
}) {
  const t = useT();
  const { edit, endGroup } = useEditor();
  const [removing, setRemoving] = useState<string | null>(null);
  const section = useRef<HTMLElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const active = overlayFor(shot, selectedElement);
  const activeId = active?.id;
  useEffect(() => {
    const panel = section.current?.closest<HTMLElement>(".inspector");
    if (!activeId || !panel || !section.current) return;
    // Scroll only the desktop inspector. Scrolling the page on touch selection
    // would move the canvas away while the user is starting to drag an image.
    if (!["auto", "scroll"].includes(getComputedStyle(panel).overflowY)) return;
    const header =
      panel.querySelector(".inspector-header")?.getBoundingClientRect()
        .height ?? 0;
    const top =
      section.current.getBoundingClientRect().top -
      panel.getBoundingClientRect().top;
    if (top < header || top > panel.clientHeight - 80)
      panel.scrollTop += top - header;
  }, [activeId]);
  const items = shot.overlays ?? [];
  function update(recipe: (overlay: ImageOverlay) => void, group?: string) {
    if (!active) return;
    edit(
      (draft) => {
        const target = draft.shots
          .find((item) => item.id === shot.id)
          ?.overlays?.find((item) => item.id === active.id);
        if (target) recipe(target);
      },
      group ? `overlay:${shot.id}:${active.id}:${group}` : undefined,
    );
  }
  function range(
    label: string,
    key: "x" | "y" | "width" | "rotation",
    min: number,
    max: number,
  ) {
    if (!active) return null;
    return (
      <label className="range-field">
        <span>
          {t(label)}
          <output>
            {Math.round(active[key])}
            {key === "rotation" ? "°" : " px"}
          </output>
        </span>
        <input
          aria-label={t(label)}
          type="range"
          min={min}
          max={max}
          step={1}
          value={active[key]}
          onChange={(event) =>
            update(
              (item) =>
                setOverlayPlacement(
                  item,
                  key === "width"
                    ? resizeOverlay(item, Number(event.target.value))
                    : { [key]: Number(event.target.value) },
                ),
              key,
            )
          }
          onPointerUp={endGroup}
          onBlur={endGroup}
        />
      </label>
    );
  }
  return (
    <section
      className="property-section overlay-section"
      ref={section}
      aria-label={t("Extra images")}
    >
      <div className="section-heading">
        <h3>{t("Extra images")}</h3>
        <small>
          {items.length}/{MAX_OVERLAYS}
        </small>
      </div>
      <p className="field-help">
        {t(
          "Add logos, awards, or artwork on top of your screenshot. PNG transparency is preserved.",
        )}
      </p>
      <button
        ref={addButton}
        type="button"
        className="button secondary full"
        disabled={items.length >= MAX_OVERLAYS}
        onClick={() => onUpload()}
      >
        <Icon name="plus" size={16} />
        {t("Add image or icon")}
      </button>
      {items.length > 0 && (
        <>
          <div
            className="overlay-list"
            role="group"
            aria-label={t("Image layers")}
          >
            {[...items].reverse().map((item) => (
              <button
                type="button"
                key={item.id}
                className="overlay-row"
                aria-pressed={active?.id === item.id}
                onClick={() => {
                  setRemoving(null);
                  onSelect(`overlay:${item.id}`);
                }}
              >
                <Thumbnail image={images.get(item.assetId)} />
                <span>{item.name}</span>
                <Icon name="edit" size={14} />
              </button>
            ))}
          </div>
          <p className="field-help">
            {t(
              "Top of the list = front of the design. Shared across languages.",
            )}
          </p>
        </>
      )}
      {active && (
        <div className="overlay-controls">
          <div className="overlay-actions">
            <button
              type="button"
              className="text-button"
              disabled={items.at(-1)?.id === active.id}
              onClick={() =>
                edit((draft) => {
                  const target = draft.shots.find(
                    (item) => item.id === shot.id,
                  );
                  if (target) reorderOverlay(target, active.id, 1);
                })
              }
            >
              {t("Bring forward")}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={items[0]?.id === active.id}
              onClick={() =>
                edit((draft) => {
                  const target = draft.shots.find(
                    (item) => item.id === shot.id,
                  );
                  if (target) reorderOverlay(target, active.id, -1);
                })
              }
            >
              {t("Send backward")}
            </button>
          </div>
          {range("Overlay size", "width", 32, 2160)}
          {range("Horizontal position", "x", -1080, 2160)}
          {range("Vertical position", "y", -2160, 4096)}
          {range("Image rotation", "rotation", -180, 180)}
          <div className="overlay-actions">
            <button
              type="button"
              className="text-button"
              onClick={() =>
                update((item) =>
                  Object.assign(
                    item,
                    overlayPlacement(project, item.width / item.height),
                  ),
                )
              }
            >
              <Icon name="reset" size={14} />
              {t("Reset placement")}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => onUpload(active.id)}
            >
              {t("Replace image")}
            </button>
          </div>
          {removing === active.id ? (
            <div
              className="overlay-confirm"
              role="group"
              aria-label={t("Remove extra image?")}
            >
              <p>{t("Remove extra image? You can undo this change.")}</p>
              <div className="overlay-actions">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setRemoving(null)}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    edit((draft) => {
                      const target = draft.shots.find(
                        (item) => item.id === shot.id,
                      );
                      if (target) removeOverlay(target, active.id);
                    });
                    setRemoving(null);
                    requestAnimationFrame(() => addButton.current?.focus());
                  }}
                >
                  {t("Remove image")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="text-button overlay-remove"
              onClick={() => setRemoving(active.id)}
            >
              <Icon name="trash" size={14} />
              {t("Remove image")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
