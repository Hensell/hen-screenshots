import type { Style } from "../core/model";
import { useT } from "../i18n/react";
import "./screenshot-fit.css";

export function ScreenshotFitControl({
  value,
  onChange,
  compact = false,
  disabled = false,
}: {
  value: Style["fit"];
  onChange: (value: Style["fit"]) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <div
      className={`screenshot-fit ${compact ? "screenshot-fit-compact" : ""}`}
    >
      {!compact && (
        <span className="screenshot-fit-heading">
          {t("How your screenshot fits")}
        </span>
      )}
      <div
        className="screenshot-fit-options"
        role="group"
        aria-label={t("Screenshot fit")}
      >
        {(["contain", "cover"] as const).map((fit) => (
          <button
            key={fit}
            type="button"
            disabled={disabled}
            aria-pressed={value === fit}
            title={t(
              fit === "contain"
                ? "Fit entire screenshot"
                : "Fill screen · crop edges",
            )}
            onClick={() => onChange(fit)}
          >
            {!compact && (
              <span
                className={`screenshot-fit-diagram screenshot-fit-${fit}`}
                aria-hidden="true"
              >
                <span />
              </span>
            )}
            <span>{t(fit === "contain" ? "Full image" : "Fill screen")}</span>
            {!compact && (
              <small>
                {t(
                  fit === "contain"
                    ? "Keeps everything visible; may leave margins."
                    : "Fills the screen; crops the edges.",
                )}
              </small>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
