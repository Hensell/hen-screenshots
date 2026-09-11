import { useT } from "../i18n/react";
import { Icon } from "../app/Icon";
import { linkedShots } from "../core/panorama";
import type { BackgroundImage, Shot } from "../core/model";
import { useEditor } from "./store";

export function BackgroundImageInspector({
  shot,
  onUpload,
}: {
  shot: Shot;
  onUpload: () => void;
}) {
  const t = useT();
  const { edit, endGroup } = useEditor();
  const background = shot.backgroundImage;
  function update(patch: Partial<BackgroundImage> | null, group?: string) {
    edit((draft) => {
      for (const target of linkedShots(draft, shot.id)) {
        if (patch === null) delete target.backgroundImage;
        else if (target.backgroundImage)
          Object.assign(target.backgroundImage, patch);
      }
    }, group);
  }
  return (
    <section className="property-section background-image-section">
      <h3>{t("Background image")}</h3>
      <p className="field-help">
        {t(
          "Your artwork behind the devices and text. Panoramas share one continuous background.",
        )}
      </p>
      <button
        type="button"
        className="button secondary full"
        onClick={onUpload}
      >
        <Icon name="image" size={16} />
        {t(background ? "Replace background" : "Add background image")}
      </button>
      {background && (
        <>
          <label className="field">
            {t("Background fit")}
            <select
              value={background.fit}
              onChange={(event) =>
                update({ fit: event.target.value as BackgroundImage["fit"] })
              }
            >
              <option value="cover">{t("Fill canvas")}</option>
              <option value="contain">{t("Fit entire image")}</option>
            </select>
          </label>
          <label className="range-field">
            <span>
              {t("Background opacity")}
              <output>{Math.round(background.opacity * 100)}%</output>
            </span>
            <input
              aria-label={t("Background opacity")}
              aria-valuetext={`${Math.round(background.opacity * 100)}%`}
              type="range"
              min="0"
              max="100"
              value={Math.round(background.opacity * 100)}
              onChange={(event) =>
                update(
                  { opacity: Number(event.target.value) / 100 },
                  `background-opacity:${shot.id}`,
                )
              }
              onPointerUp={endGroup}
              onPointerCancel={endGroup}
              onKeyUp={endGroup}
              onBlur={endGroup}
            />
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() => update(null)}
          >
            <Icon name="trash" size={14} />
            {t("Remove background")}
          </button>
        </>
      )}
    </section>
  );
}
