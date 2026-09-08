import { useT } from "../i18n/react";
import { useEditor } from "./store";
import { Icon } from "../app/Icon";
import {
  compositionLayout,
  companionFor,
  deviceShot,
  editDevice,
  isDeviceElement,
} from "../core/device-composition";
import {
  PLACEMENT_LIMITS,
  resolveStyle,
  type CanvasElement,
  type DeviceElement,
  type DeviceFamily,
  type Project,
  type Shot,
  type Style,
} from "../core/model";
import { resizeDevice } from "../core/device-placement";
import { languageName, localContent } from "../core/localization";
import "./device-composition.css";

export function DeviceCompositionInspector({
  project,
  shot,
  sourceShot,
  locale,
  selectedElement,
  onSelect,
  onReplace,
  deviceNames,
}: {
  project: Project;
  shot: Shot;
  sourceShot: Shot;
  locale: string | null;
  selectedElement: CanvasElement | null;
  onSelect: (element: DeviceElement) => void;
  onReplace: (element: DeviceElement) => void;
  deviceNames: Record<DeviceFamily, string>;
}) {
  const t = useT();
  const { edit, endGroup } = useEditor();
  const elements: DeviceElement[] = [
    "device",
    ...(shot.companions ?? []).map(
      (device) => `device:${device.id}` as DeviceElement,
    ),
  ];
  const active =
    selectedElement &&
    isDeviceElement(selectedElement) &&
    elements.includes(selectedElement)
      ? selectedElement
      : "device";
  const selected = deviceShot(shot, active);
  const style = resolveStyle(project, selected);
  const index = elements.indexOf(active);
  const originalWidth = compositionLayout(
    project,
    resolveStyle(project, shot),
    shot.companions,
  ).devices[index].width;
  const override = locale ? sourceShot.translations?.[locale] : undefined;
  const companion = companionFor(shot, active);
  const hasOverride = companion
    ? override?.deviceAssets?.[companion.id]
    : override?.assetId;
  function update(
    recipe: (device: Shot, project: Project, shot: Shot) => void,
    group?: string,
  ) {
    edit(
      (draft) => {
        const target = draft.shots.find((item) => item.id === shot.id);
        if (target)
          editDevice(target, active, (device) => recipe(device, draft, target));
      },
      group ? `device:${shot.id}:${active}:${group}` : undefined,
    );
  }
  function setStyle(patch: Partial<Style>) {
    update((device) => Object.assign(device.style, patch));
  }
  function range(
    label: string,
    key: keyof Shot["phone"],
    min: number,
    max: number,
  ) {
    return (
      <label className="range-field">
        <span>
          {t(label)}
          <output>
            {key === "width"
              ? `${Math.round((selected.phone.width / originalWidth) * 100)}%`
              : Math.round(selected.phone[key])}
            {key === "rotation" ? "°" : ""}
          </output>
        </span>
        <input
          type="range"
          aria-label={t(label)}
          min={min}
          max={max}
          step={1}
          value={selected.phone[key]}
          onChange={(event) =>
            update((device, draft) => {
              if (key === "width")
                resizeDevice(
                  device,
                  resolveStyle(draft, device),
                  Number(event.target.value),
                );
              else device.phone[key] = Number(event.target.value);
            }, key)
          }
          onPointerUp={endGroup}
          onBlur={endGroup}
        />
      </label>
    );
  }
  return (
    <>
      <section className="property-section">
        <h3>{t("Devices in this slide")}</h3>
        <p className="section-intro">
          {t(
            "Select a device here or on the canvas. Each one has its own image and placement.",
          )}
        </p>
        <div
          className="composition-device-list"
          role="group"
          aria-label={t("Select device")}
        >
          {elements.map((element, index) => {
            const slot = deviceShot(shot, element);
            const family = resolveStyle(project, slot).device;
            return (
              <button
                type="button"
                key={element}
                aria-pressed={active === element}
                onClick={() => onSelect(element)}
              >
                <span className={`device-glyph ${family}`} aria-hidden="true" />
                <span>
                  {t(deviceNames[family])}
                  <small>{t("Device {number}", { number: index + 1 })}</small>
                </span>
                {active === element && <Icon name="check" size={16} />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="button composition-replace"
          onClick={() => onReplace(active)}
        >
          <Icon name="image" />
          {t("Replace selected image")}
        </button>
        <p className="field-help">
          {t(
            "Changes only this device. The rest of the composition stays as it is.",
          )}
        </p>
        {locale && (
          <p className="field-help">
            {t(
              "Replacing the screenshot changes only {language}. Its frame and position stay shared.",
              { language: languageName(locale) },
            )}
          </p>
        )}
        {hasOverride && (
          <button
            type="button"
            className="text-button"
            onClick={() =>
              update((_device, _draft, target) => {
                const content = localContent(target, locale!);
                if (companion) delete content.deviceAssets?.[companion.id];
                else delete content.assetId;
              })
            }
          >
            <Icon name="reset" size={14} />
            {t("Use original image")}
          </button>
        )}
      </section>
      <section className="property-section">
        <div className="section-heading">
          <h3>{t("Device size")}</h3>
          <button
            type="button"
            className="text-button"
            aria-label={t("Reset selected device placement")}
            onClick={() =>
              update((device, draft, target) => {
                device.phone = {
                  ...compositionLayout(
                    draft,
                    resolveStyle(draft, target),
                    target.companions,
                  ).devices[index],
                };
              })
            }
          >
            <Icon name="reset" size={14} />
            {t("Reset")}
          </button>
        </div>
        {range(
          "Device size",
          "width",
          PLACEMENT_LIMITS.width.min,
          PLACEMENT_LIMITS.width.max,
        )}
        <p className="field-help">
          {t(
            "Drag a corner on the canvas, or adjust here. 100% is the template’s original size.",
          )}
        </p>
        {range(
          "Horizontal position",
          "x",
          PLACEMENT_LIMITS.x.min,
          PLACEMENT_LIMITS.x.max,
        )}
        {range(
          "Vertical position",
          "y",
          PLACEMENT_LIMITS.y.min,
          PLACEMENT_LIMITS.y.max,
        )}
        {range("Device rotation", "rotation", -20, 20)}
      </section>
      <section className="property-section">
        <h3>{t("Device frame")}</h3>
        <label className="field">
          {t("Device family")}
          <select
            value={style.device}
            onChange={(event) => {
              const device = event.target.value as DeviceFamily;
              setStyle({
                device,
                deviceOrientation:
                  device === "monitor" ||
                  device === "laptop" ||
                  device === "card"
                    ? "landscape"
                    : "portrait",
              });
            }}
          >
            {Object.entries(deviceNames).map(([id, name]) => (
              <option key={id} value={id}>
                {t(name)}
              </option>
            ))}
          </select>
        </label>
        {style.device !== "monitor" && style.device !== "laptop" && (
          <label className="field">
            {t("Frame orientation")}
            <select
              value={style.deviceOrientation}
              onChange={(event) =>
                setStyle({
                  deviceOrientation: event.target
                    .value as Style["deviceOrientation"],
                })
              }
            >
              <option value="portrait">{t("Portrait")}</option>
              <option value="landscape">{t("Landscape")}</option>
            </select>
          </label>
        )}
        <label className="field">
          {t("Screenshot fit")}
          <select
            value={style.fit}
            onChange={(event) =>
              setStyle({ fit: event.target.value as Style["fit"] })
            }
          >
            <option value="contain">{t("Fit entire screenshot")}</option>
            <option value="cover">{t("Fill screen · crop edges")}</option>
          </select>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={style.frame}
            onChange={(event) => setStyle({ frame: event.target.checked })}
          />
          {style.device === "card"
            ? t("Rounded corners")
            : t("Show device frame")}
        </label>
        {style.device !== "card" && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={style.camera}
              onChange={(event) => setStyle({ camera: event.target.checked })}
            />
            {style.device === "ios"
              ? t("Add Dynamic Island")
              : t("Add front camera")}
          </label>
        )}
      </section>
    </>
  );
}
