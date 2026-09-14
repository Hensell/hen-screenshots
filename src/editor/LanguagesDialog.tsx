import { Select } from "../ui/Select";
import { useT } from "../i18n/react";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../core/model";
import {
  addLanguage,
  removeLanguage,
  languageName,
  languages,
  localeStatus,
  writeText,
  reviewTranslation,
  applyTranslations,
  MAX_LANGUAGES,
} from "../core/localization";
import { translationRoute } from "../translation/catalog";
import { TranslatorDialog } from "./TranslatorDialog";
import { useModal } from "./useModal";
import { Icon } from "../app/Icon";
import "./languages.css";

type Edit = (recipe: (project: Project) => void, group?: string) => void;
const statusLabels = {
  untranslated: "To translate",
  draft: "Draft",
  outdated: "Original changed",
  reviewed: "Reviewed",
};

export function LanguagesDialog({
  project,
  locale,
  saveStatus,
  onClose,
  onLocale,
  onEdit,
  onSelect,
}: {
  project: Project;
  locale: string | null;
  saveStatus: "saved" | "pending" | "saving" | "error";
  onClose: () => void;
  onLocale: (locale: string | null) => void;
  onEdit: Edit;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useModal(ref);
  const [source, setSource] = useState(project.localization?.source ?? "en");
  const [target, setTarget] = useState(source === "es" ? "en" : "es");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [addingLanguage, setAddingLanguage] = useState(false);
  const mobileLanguageRef = useRef<HTMLSelectElement>(null);
  const originalLanguageRef = useRef<HTMLButtonElement>(null);
  const removeLanguageRef = useRef<HTMLButtonElement>(null);
  const keepLanguageRef = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sourceLanguage = project.localization?.source ?? source;
  const selectedLocale =
    locale && project.localization?.targets.includes(locale) ? locale : null;
  const available = languages.filter(
    ([code]) =>
      code !== sourceLanguage && !project.localization?.targets.includes(code),
  );
  const selectedTarget = available.some(([code]) => code === target)
    ? target
    : (available[0]?.[0] ?? "");
  const reviewed = selectedLocale
    ? project.shots.filter(
        (shot) => localeStatus(shot, selectedLocale) === "reviewed",
      ).length
    : 0;
  useEffect(() => {
    if (deleting === selectedLocale && deleting)
      keepLanguageRef.current?.focus();
  }, [deleting, selectedLocale]);
  function keepLanguage() {
    setDeleting(null);
    requestAnimationFrame(() => removeLanguageRef.current?.focus());
  }
  return (
    <dialog
      ref={ref}
      className="languages-dialog"
      aria-labelledby="languages-title"
      onCancel={(event) => {
        event.preventDefault();
        if (event.target !== event.currentTarget) return;
        if (deleting === selectedLocale && deleting) keepLanguage();
        else onClose();
      }}
    >
      <header className="languages-heading">
        <div>
          <h2 id="languages-title">{t("Languages")}</h2>
          <p>
            {t(
              "Translate your titles and supporting text. Keep one shared design.",
            )}
          </p>
        </div>
        <button
          className="icon-button"
          aria-label={t("Close languages")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <section
        className="language-automation"
        aria-labelledby="language-automation-title"
      >
        <div>
          <h3 id="language-automation-title">{t("AI translation")}</h3>
          <p>
            {t(
              "Translate every slide into your added languages, one at a time. Free, on your device.",
            )}
          </p>
          {!project.localization?.targets.length && (
            <small>{t("Add a language below to get started.")}</small>
          )}
        </div>
        <button
          className="button primary"
          disabled={
            !project.localization?.targets.length || !project.shots.length
          }
          onClick={() => setDownloadOpen(true)}
        >
          <Icon name="languages" />
          {t("Translate with AI")}
        </button>
      </section>
      <div className="languages-body">
        <aside
          className="languages-sidebar"
          aria-label={t("Project languages")}
        >
          {project.localization && (
            <div className="mobile-language-picker">
              <label className="field">
                {t("Editing language")}
                <Select
                  ref={mobileLanguageRef}
                  value={selectedLocale ?? "original"}
                  onChange={(event) => {
                    onLocale(
                      event.target.value === "original"
                        ? null
                        : event.target.value,
                    );
                    setNotice(null);
                  }}
                >
                  <option value="original">
                    {languageName(sourceLanguage)} · {t("Original text")}
                  </option>
                  {project.localization.targets.map((code) => (
                    <option value={code} key={code}>
                      {languageName(code)}
                    </option>
                  ))}
                </Select>
              </label>
              <button
                className="button secondary language-add-toggle"
                aria-expanded={addingLanguage}
                aria-controls="add-language-form"
                onClick={() => setAddingLanguage(!addingLanguage)}
              >
                <Icon name={addingLanguage ? "close" : "plus"} size={16} />
                {t(addingLanguage ? "Cancel" : "Add language")}
              </button>
            </div>
          )}
          <h3 className={project.localization ? "desktop-language-label" : ""}>
            {t("Original language")}
          </h3>
          {project.localization ? (
            <button
              ref={originalLanguageRef}
              className={`language-choice original-language-choice ${!selectedLocale ? "active" : ""}`}
              onClick={() => onLocale(null)}
              aria-pressed={!selectedLocale}
            >
              <span className="language-code">{sourceLanguage}</span>
              <span>
                <strong>{languageName(sourceLanguage)}</strong>
                <small>{t("Original text")}</small>
              </span>
            </button>
          ) : (
            <label className="field">
              <span className="sr-only">{t("Original language")}</span>
              <Select
                aria-label={t("Original language")}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                {languages.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <h3 className="translations-heading">
            {t("Translations")}{" "}
            <span>{project.localization?.targets.length ?? 0}</span>
          </h3>
          <nav aria-label={t("Language versions")}>
            {project.localization?.targets.map((code) => (
              <button
                key={code}
                className={`language-choice ${selectedLocale === code ? "active" : ""}`}
                aria-pressed={selectedLocale === code}
                onClick={() => {
                  onLocale(code);
                  setNotice(null);
                }}
              >
                <span className="language-code">{code}</span>
                <span>
                  <strong>{languageName(code)}</strong>
                  <small>
                    {t("{reviewed} / {total} reviewed", {
                      reviewed: project.shots.filter(
                        (shot) => localeStatus(shot, code) === "reviewed",
                      ).length,
                      total: project.shots.length,
                    })}
                  </small>
                  {!translationRoute(sourceLanguage, code) && (
                    <small>{t("Manual editing")}</small>
                  )}
                </span>
              </button>
            ))}
          </nav>
          {!project.localization?.targets.length && (
            <p className="field-help">
              {t("Add a language to start with a copy of your original text.")}
            </p>
          )}
          <form
            id="add-language-form"
            className={`add-language ${addingLanguage || !project.localization ? "is-expanded" : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedTarget) return;
              onEdit((draft) =>
                addLanguage(draft, sourceLanguage, selectedTarget),
              );
              onLocale(selectedTarget);
              setAddingLanguage(false);
              requestAnimationFrame(() => {
                const picker = mobileLanguageRef.current;
                if (picker?.getClientRects().length)
                  picker.focus({ preventScroll: true });
              });
              setNotice(
                "Language added. Edit the text below or choose Translate with AI.",
              );
            }}
          >
            <label className="field">
              {t("Add a language")}
              <Select
                aria-label={t("New language")}
                value={selectedTarget}
                onChange={(event) => setTarget(event.target.value)}
                disabled={
                  (project.localization?.targets.length ?? 0) >=
                  MAX_LANGUAGES - 1
                }
              >
                {available.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </Select>
            </label>
            <button
              className="button secondary full"
              disabled={
                !selectedTarget ||
                (project.localization?.targets.length ?? 0) >= MAX_LANGUAGES - 1
              }
            >
              <Icon name="plus" size={16} />
              {t("Add language")}
            </button>
          </form>
          <p className="field-help language-design-note">
            {t(
              "Colors, frames, and device positions stay linked across languages.",
            )}
          </p>
        </aside>
        <section
          className="language-content"
          aria-label={t("Translation editor")}
        >
          <div className="language-content-heading">
            <div>
              <h3>
                {selectedLocale
                  ? languageName(selectedLocale)
                  : t("Your original text")}
              </h3>
              <p>
                {selectedLocale
                  ? t("{reviewed} / {total} reviewed", {
                      reviewed,
                      total: project.shots.length,
                    })
                  : project.localization
                    ? t(
                        "Your original captions. Add a language to create another version of this series.",
                      )
                    : t(
                        "Choose the language your existing captions are written in, then add a translation.",
                      )}
              </p>
            </div>
          </div>
          {notice && (
            <p className="language-notice" role="status">
              {t(notice)}
            </p>
          )}
          <div className="language-slides">
            {project.shots.map((shot, index) => {
              const content = selectedLocale
                ? shot.translations?.[selectedLocale]
                : undefined;
              const status = selectedLocale
                ? localeStatus(shot, selectedLocale)
                : null;
              return (
                <article className="language-slide" key={shot.id}>
                  <header>
                    <button
                      className="text-button"
                      onClick={() => {
                        onSelect(shot.id);
                        onClose();
                      }}
                    >
                      {t("Slide {number}", {
                        number: String(index + 1).padStart(2, "0"),
                      })}
                      <Icon name="arrow" size={14} />
                    </button>
                    {status && (
                      <span className={`translation-status ${status}`}>
                        {t(statusLabels[status])}
                      </span>
                    )}
                  </header>
                  <div
                    className={`translation-columns ${selectedLocale ? "" : "original-only"}`}
                  >
                    <div
                      className={`original-copy ${selectedLocale ? "desktop-original-copy" : ""}`}
                    >
                      <span className="original-label">
                        {t("{language} · Original", {
                          language: languageName(sourceLanguage),
                        })}
                      </span>
                      <strong>{shot.title || t("No headline")}</strong>
                      <p>{shot.subtitle || t("No supporting text")}</p>
                    </div>
                    {selectedLocale && (
                      <div className="translated-copy">
                        <details className="mobile-original-copy">
                          <summary>{t("View original text")}</summary>
                          <div className="original-copy">
                            <span className="original-label">
                              {t("{language} · Original", {
                                language: languageName(sourceLanguage),
                              })}
                            </span>
                            <strong>{shot.title || t("No headline")}</strong>
                            <p>{shot.subtitle || t("No supporting text")}</p>
                          </div>
                        </details>
                        <label className="field">
                          {t("Headline")}
                          <textarea
                            lang={selectedLocale}
                            rows={3}
                            maxLength={300}
                            value={content?.title ?? shot.title}
                            onChange={(event) =>
                              onEdit(
                                (draft) =>
                                  writeText(
                                    draft.shots.find(
                                      (item) => item.id === shot.id,
                                    )!,
                                    selectedLocale,
                                    "title",
                                    event.target.value,
                                  ),
                                `${shot.id}:${selectedLocale}:title`,
                              )
                            }
                          />
                        </label>
                        <label className="field">
                          {t("Supporting text")}
                          <textarea
                            lang={selectedLocale}
                            rows={2}
                            maxLength={450}
                            value={content?.subtitle ?? shot.subtitle}
                            onChange={(event) =>
                              onEdit(
                                (draft) =>
                                  writeText(
                                    draft.shots.find(
                                      (item) => item.id === shot.id,
                                    )!,
                                    selectedLocale,
                                    "subtitle",
                                    event.target.value,
                                  ),
                                `${shot.id}:${selectedLocale}:subtitle`,
                              )
                            }
                          />
                        </label>
                        <button
                          className="text-button review-translation"
                          disabled={status === "reviewed"}
                          onClick={() =>
                            onEdit((draft) =>
                              reviewTranslation(
                                draft.shots.find(
                                  (item) => item.id === shot.id,
                                )!,
                                selectedLocale,
                              ),
                            )
                          }
                        >
                          <Icon name="check" size={15} />
                          {status === "reviewed"
                            ? t("Reviewed")
                            : t("Mark as reviewed")}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {selectedLocale && (
            <p className="language-caption-note">
              {t(
                "These are the words around your screenshot. To show your app in this language, replace its image in the editor.",
              )}
            </p>
          )}
          {selectedLocale && (
            <div className="language-remove">
              {deleting === selectedLocale ? (
                <div role="alert">
                  <p>
                    {t(
                      "Remove {language} and its text and image overrides? Your other languages stay. You can undo this.",
                      { language: languageName(selectedLocale) },
                    )}
                  </p>
                  <button
                    ref={keepLanguageRef}
                    className="button secondary"
                    onClick={keepLanguage}
                  >
                    {t("Keep language")}
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      onEdit((draft) => removeLanguage(draft, selectedLocale));
                      onLocale(null);
                      setDeleting(null);
                      requestAnimationFrame(() => {
                        const picker = mobileLanguageRef.current;
                        if (picker?.getClientRects().length) picker.focus();
                        else originalLanguageRef.current?.focus();
                      });
                    }}
                  >
                    {t("Remove language")}
                  </button>
                </div>
              ) : (
                <button
                  ref={removeLanguageRef}
                  className="text-button"
                  onClick={() => setDeleting(selectedLocale)}
                >
                  <Icon name="trash" size={15} />
                  {t("Remove this language")}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="languages-footer">
        <div className="language-save-info">
          <p className={`language-save-status ${saveStatus}`} role="status">
            <Icon
              name={saveStatus === "saved" ? "check" : "folder"}
              size={16}
            />
            {t(
              saveStatus === "saved"
                ? "Saved on this device"
                : saveStatus === "error"
                  ? "Not saved"
                  : "Saving…",
            )}
          </p>
          <small>
            {t(
              "Translations are included when you download your project file.",
            )}
          </small>
        </div>
        <button className="button primary" onClick={onClose}>
          {t("Done")}
        </button>
      </footer>
      {downloadOpen && project.localization && (
        <TranslatorDialog
          project={project}
          onClose={() => setDownloadOpen(false)}
          onApply={(language, entries) => {
            onEdit((draft) => applyTranslations(draft, language, entries));
            if (!selectedLocale) onLocale(language);
            setNotice(
              "Translation drafts are ready. Review the wording and check each slide in the editor.",
            );
          }}
        />
      )}
    </dialog>
  );
}
