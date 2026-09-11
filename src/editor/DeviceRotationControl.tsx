import { useId } from "react";
import { Icon } from "../app/Icon";
import { DEVICE_ROTATION_LIMITS } from "../core/model";
import { useT } from "../i18n/react";

export function DeviceRotationControl({
  angle,
  label = "Device rotation",
  onChange,
  onCommit,
  onReset,
}: {
  angle: number;
  label?: string;
  onChange: (angle: number) => void;
  onCommit: () => void;
  onReset: () => void;
}) {
  const t = useT();
  const inputId = useId();
  const helpId = useId();
  return (
    <section className="property-section">
      <div className="section-heading">
        <h3>{t(label)}</h3>
        <button type="button" className="text-button" onClick={onReset}>
          <Icon name="reset" size={14} />
          {t("Reset rotation")}
        </button>
      </div>
      <label className="range-field" htmlFor={inputId}>
        <span>
          {t("Angle")}
          <output>{Math.round(angle)}°</output>
        </span>
        <input
          id={inputId}
          type="range"
          aria-label={t(label)}
          aria-describedby={helpId}
          aria-valuetext={`${Math.round(angle)}°`}
          min={DEVICE_ROTATION_LIMITS.min}
          max={DEVICE_ROTATION_LIMITS.max}
          step={1}
          value={angle}
          onChange={(event) => onChange(Number(event.target.value))}
          onPointerUp={onCommit}
          onPointerCancel={onCommit}
          onKeyUp={onCommit}
          onBlur={onCommit}
        />
      </label>
      <p className="field-help" id={helpId}>
        {t(
          "Drag the round handle on the canvas to rotate a full 360°. Reset restores only the template’s angle.",
        )}
      </p>
    </section>
  );
}
