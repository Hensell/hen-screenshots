import {
  PROFILE_REVIEW_DATE,
  type ExportProfile,
} from "../core/export-profiles";
import { publicationAdvice, type ExportReview } from "../export/review";
import { useT } from "../i18n/react";
import { Icon } from "./Icon";
import "./export-checks.css";

export function ExportChecks({
  profile,
  count,
  review,
  format = "png",
}: {
  profile: ExportProfile;
  count: number;
  review?: ExportReview;
  format?: "png" | "jpeg";
}) {
  const t = useT();
  return (
    <section className="export-checks" aria-label={t("Export checks")}>
      <h3>
        <Icon name={review?.blocked ? "close" : "check"} size={17} />
        {t(review ? "Files checked" : "Before you export")}
      </h3>
      <dl>
        <div>
          <dt>{t("Dimensions")}</dt>
          <dd>
            {profile.width} × {profile.height} px
          </dd>
        </div>
        <div>
          <dt>{t("Series")}</dt>
          <dd>
            {count} / {profile.maxCount}
          </dd>
        </div>
        <div>
          <dt>{t("Format")}</dt>
          <dd>
            {(review?.format ?? format) === "jpeg" ? "JPEG" : "PNG"} · RGB ·{" "}
            {t("No transparency")}
          </dd>
        </div>
        <div>
          <dt>{t("File size")}</dt>
          <dd>
            {t(
              profile.maxBytes
                ? "8 MB maximum per image"
                : "8 MB suggested per image",
            )}
          </dd>
        </div>
      </dl>
      {!profile.maxBytes && (
        <p className="field-help">
          {t(
            "The size suggestion is ours, not a universal store limit. Exact file sizes are checked after rendering.",
          )}
        </p>
      )}
      {review && (
        <>
          <ul className="export-file-list" aria-label={t("Exported files")}>
            {review.files.map((file) => (
              <li key={file.name}>
                <span>{file.name}</span>
                <strong
                  className={file.large ? "export-file-large" : undefined}
                >
                  {(file.bytes / 1_000_000).toFixed(2)} MB
                </strong>
              </li>
            ))}
          </ul>
          {review.blocked ? (
            <p className="export-file-warning" role="alert">
              {t(
                "Some images exceed this destination’s 8 MB limit. Prepare smaller JPEGs before saving.",
              )}
            </p>
          ) : (
            review.files.some((file) => file.large) && (
              <p className="export-file-warning">
                {t(
                  "Some images exceed our suggested size. You can save them or prepare smaller JPEGs at the same resolution.",
                )}
              </p>
            )
          )}
          <p className="field-help">
            {t(
              "Dimensions and image format verified. Review the artwork and readability before uploading to a store.",
            )}
          </p>
        </>
      )}
      {profile.store !== "presentation" && (
        <details
          className="export-store-advice"
          open={profile.sourceOnly || undefined}
        >
          <summary>
            {t("Store guidance")}{" "}
            <span>{t("Checked {date}", { date: PROFILE_REVIEW_DATE })}</span>
          </summary>
          <ul>
            {publicationAdvice(profile, count).map((text) => (
              <li key={text}>{t(text)}</li>
            ))}
          </ul>
          <p>{t(profile.note)}</p>
          <a href={profile.source} target="_blank" rel="noopener noreferrer">
            {t("View store requirements ↗")}
          </a>
        </details>
      )}
    </section>
  );
}
