import { useId, useRef, useState } from "react";
import { Icon } from "../app/Icon";
import { useT } from "../i18n/react";
import { Select } from "../ui/Select";
import {
  exportProfiles,
  resolveExportProfile,
  type ExportProfileId,
} from "../core/export-profiles";
import { projectPurpose, storeSlotForProfile } from "../core/canvas-formats";
import type { Project } from "../core/model";
import { selectCanvasFormat } from "../core/select-canvas-format";
import { useEditor } from "./store";
import "./canvas-format-picker.css";

export function CanvasFormatPicker({
  project,
  disabled,
  onAdvanced,
}: {
  project: Project;
  disabled: boolean;
  onAdvanced: () => void;
}) {
  const t = useT();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [store, setStore] = useState("all");
  const [device, setDevice] = useState("all");
  const [orientation, setOrientation] = useState("all");
  const profile = resolveExportProfile(project);
  const edit = useEditor((state) => state.edit);
  const devices = [
    ...new Set(
      exportProfiles
        .filter((p) => store === "all" || p.store === store)
        .map(
          (p) =>
            storeSlotForProfile(p.id)?.name ??
            (p.category === "banner" ? "Banners" : "Portfolio"),
        ),
    ),
  ];
  const results = exportProfiles.filter((p) => {
    const name =
      storeSlotForProfile(p.id)?.name ??
      (p.category === "banner" ? "Banners" : "Portfolio");
    const shape =
      p.width === p.height
        ? "square"
        : p.width > p.height
          ? "landscape"
          : "portrait";
    const terms =
      `${t(p.name)} ${p.name} ${p.width} ${p.height} ${p.width}x${p.height} ${p.width}×${p.height}`.toLocaleLowerCase();
    return (
      (store === "all" || p.store === store) &&
      (device === "all" || device === name) &&
      (orientation === "all" || orientation === shape) &&
      query
        .toLocaleLowerCase()
        .replace(/\s*[×x]\s*/g, "x")
        .split(/\s+/)
        .every((term) => terms.replace(/×/g, "x").includes(term))
    );
  });
  function close() {
    panel.current?.hidePopover();
    trigger.current?.focus();
  }
  function select(value: ExportProfileId) {
    edit((draft) => selectCanvasFormat(draft, value));
    close();
  }
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="canvas-format-button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        aria-label={t("Canvas settings: {name}, {width} × {height}", {
          name: t(profile.name),
          width: profile.width,
          height: profile.height,
        })}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          const bounds = trigger.current!.getBoundingClientRect();
          panel.current!.style.setProperty(
            "--picker-top",
            `${Math.min(bounds.bottom + 8, window.innerHeight - 180)}px`,
          );
          panel.current!.style.setProperty(
            "--picker-right",
            `${Math.max(12, window.innerWidth - bounds.right)}px`,
          );
          panel.current!.showPopover();
          search.current?.focus();
        }}
      >
        <Icon name="canvas" size={17} />
        <span>
          <small>
            {t(
              projectPurpose(project) === "stores"
                ? "App stores"
                : projectPurpose(project) === "banners"
                  ? "Banners"
                  : "Portfolio",
            )}{" "}
            {t("· Canvas")}
          </small>
          <strong>
            {profile.width} × {profile.height}
          </strong>
        </span>
        <Icon name="down" size={13} />
      </button>
      <div
        ref={panel}
        popover="auto"
        id={id}
        className="canvas-format-picker"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
        role="dialog"
        aria-label={t("Choose store, device and resolution")}
        onToggle={() =>
          setOpen(panel.current?.matches(":popover-open") ?? false)
        }
      >
        <div className="format-picker-heading">
          <div>
            <strong>{t("Choose your format")}</strong>
            <p>{t("Store, device and resolution in one selection.")}</p>
          </div>
          <button
            type="button"
            className="text-button"
            aria-label={t("Close")}
            onClick={close}
          >
            ×
          </button>
        </div>
        <label className="field">
          {t("Search formats")}
          <input
            ref={search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search device or resolution…")}
            type="search"
          />
        </label>
        <div className="format-picker-filters">
          <label className="field">
            {t("Store")}
            <Select
              value={store}
              onChange={(e) => {
                setStore(e.target.value);
                setDevice("all");
              }}
            >
              <option value="all">{t("All stores")}</option>
              <option value="apple">Apple App Store</option>
              <option value="google">Google Play</option>
              <option value="presentation">{t("Portfolio")}</option>
            </Select>
          </label>
          <label className="field">
            {t("Device")}
            <Select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="all">{t("All devices")}</option>
              {devices.map((name) => (
                <option key={name} value={name}>
                  {t(name)}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            {t("Orientation")}
            <Select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value)}
            >
              <option value="all">{t("All orientations")}</option>
              <option value="portrait">{t("Portrait")}</option>
              <option value="landscape">{t("Landscape")}</option>
              <option value="square">{t("Square")}</option>
            </Select>
          </label>
        </div>
        <div
          className="format-picker-results"
          aria-label={t("Available formats")}
          onKeyDown={(event) => {
            if (!(event.target instanceof HTMLButtonElement)) return;
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            );
            const index = buttons.indexOf(event.target);
            const next =
              event.key === "ArrowDown"
                ? Math.min(index + 1, buttons.length - 1)
                : event.key === "ArrowUp"
                  ? Math.max(index - 1, 0)
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? buttons.length - 1
                      : null;
            if (next !== null) {
              event.preventDefault();
              buttons[next]?.focus();
            }
          }}
        >
          {results.map((item) => (
            <button
              type="button"
              key={item.id}
              className="format-picker-option"
              aria-pressed={item.id === project.exportProfile}
              disabled={disabled}
              onClick={() => select(item.id)}
            >
              <Icon name="canvas" size={20} />
              <span>
                <strong>
                  {t(storeSlotForProfile(item.id)?.name ?? item.name)}
                </strong>
                <small>
                  {item.store === "apple"
                    ? "Apple App Store"
                    : item.store === "google"
                      ? "Google Play"
                      : t("Portfolio")}{" "}
                  ·{" "}
                  {t(
                    item.width === item.height
                      ? "Square"
                      : item.width > item.height
                        ? "Landscape"
                        : "Portrait",
                  )}
                </small>
              </span>
              <b>
                {item.id === "portfolio-custom"
                  ? t("Custom")
                  : `${item.width} × ${item.height}`}
              </b>
              {item.id === project.exportProfile && (
                <span aria-hidden="true">✓</span>
              )}
            </button>
          ))}
          {!results.length && (
            <p className="format-picker-empty">
              {t("No formats match your search.")}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setStore("all");
                  setDevice("all");
                  setOrientation("all");
                }}
              >
                {t("Clear filters")}
              </button>
            </p>
          )}
        </div>
        <div className="format-picker-footer">
          <small>
            {t("Canvas and main device apply to all slides. Undo anytime.")}
          </small>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              close();
              onAdvanced();
            }}
          >
            {t("More canvas settings")}
          </button>
        </div>
      </div>
    </>
  );
}
