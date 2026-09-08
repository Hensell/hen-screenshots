import { useEffect, useRef, useState } from "react";
import type { Project } from "../core/model";
import { errorMessage } from "../core/model";
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
import {
  downloadedPacks,
  clearTranslationCache,
  translateLocally,
  type TranslationProgress,
} from "../translation/client";
import { Icon } from "../app/Icon";
import "./languages.css";

type Edit = (recipe: (project: Project) => void, group?: string) => void;
function useModal(ref: React.RefObject<HTMLDialogElement | null>) {
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, [ref]);
}
const statusLabels = {
  untranslated: "To translate",
  draft: "Draft",
  outdated: "Original changed",
  reviewed: "Reviewed",
};

export function LanguagesDialog({
  project,
  locale,
  onClose,
  onLocale,
  onEdit,
  onSelect,
}: {
  project: Project;
  locale: string | null;
  onClose: () => void;
  onLocale: (locale: string | null) => void;
  onEdit: Edit;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useModal(ref);
  const [source, setSource] = useState(project.localization?.source ?? "en");
  const [target, setTarget] = useState(source === "es" ? "en" : "es");
  const [downloadOpen, setDownloadOpen] = useState(false);
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
  return (
    <dialog
      ref={ref}
      className="languages-dialog"
      aria-labelledby="languages-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="languages-heading">
        <div>
          <span className="eyebrow">YOUR SERIES, IN MORE WORDS</span>
          <h2 id="languages-title">Languages</h2>
          <p>One shared design. A version for every audience.</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close languages"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="languages-body">
        <aside className="languages-sidebar" aria-label="Project languages">
          <h3>Original language</h3>
          {project.localization ? (
            <button
              className={`language-choice ${!selectedLocale ? "active" : ""}`}
              onClick={() => onLocale(null)}
              aria-pressed={!selectedLocale}
            >
              <span className="language-code">{sourceLanguage}</span>
              <span>
                <strong>{languageName(sourceLanguage)}</strong>
                <small>Original text</small>
              </span>
            </button>
          ) : (
            <label className="field">
              <span className="sr-only">Original language</span>
              <select
                aria-label="Original language"
                value={source}
                onChange={(event) => setSource(event.target.value)}
              >
                {languages.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <h3 className="translations-heading">
            Translations{" "}
            <span>{project.localization?.targets.length ?? 0}</span>
          </h3>
          <nav aria-label="Language versions">
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
                    {
                      project.shots.filter(
                        (shot) => localeStatus(shot, code) === "reviewed",
                      ).length
                    }{" "}
                    / {project.shots.length} reviewed
                  </small>
                </span>
              </button>
            ))}
          </nav>
          {!project.localization?.targets.length && (
            <p className="field-help">
              Add a language to start with a copy of your original text.
            </p>
          )}
          <form
            className="add-language"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedTarget) return;
              onEdit((draft) =>
                addLanguage(draft, sourceLanguage, selectedTarget),
              );
              onLocale(selectedTarget);
              setNotice(
                "Language added. Edit the copied text or use the optional translator.",
              );
            }}
          >
            <label className="field">
              Add a language
              <select
                aria-label="New language"
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
              </select>
            </label>
            <button
              className="button secondary full"
              disabled={
                !selectedTarget ||
                (project.localization?.targets.length ?? 0) >= MAX_LANGUAGES - 1
              }
            >
              <Icon name="plus" size={16} />
              Add language
            </button>
          </form>
          <p className="field-help">
            Colors, frames and device positions stay linked across languages.
          </p>
        </aside>
        <section className="language-content" aria-label="Translation editor">
          <div className="language-content-heading">
            <div>
              <h3>
                {selectedLocale
                  ? languageName(selectedLocale)
                  : "Your original text"}
              </h3>
              <p>
                {selectedLocale
                  ? `${reviewed} of ${project.shots.length} slides reviewed. Changes are saved as you type.`
                  : project.localization
                    ? "Your original captions. Add a language to create another version of this series."
                    : "Choose the language your existing captions are written in, then add a translation."}
              </p>
            </div>
            {selectedLocale && (
              <button
                className="button secondary"
                onClick={() => setDownloadOpen(true)}
              >
                <Icon name="download" size={16} />
                Translate on device
              </button>
            )}
          </div>
          {notice && (
            <p className="language-notice" role="status">
              {notice}
            </p>
          )}
          {selectedLocale && (
            <p className="language-caption-note">
              These are the words around your screenshot. To show your app in
              this language, replace its image in the editor.
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
                      Slide {String(index + 1).padStart(2, "0")}
                      <Icon name="arrow" size={14} />
                    </button>
                    {status && (
                      <span className={`translation-status ${status}`}>
                        {statusLabels[status]}
                      </span>
                    )}
                  </header>
                  <div
                    className={`translation-columns ${selectedLocale ? "" : "original-only"}`}
                  >
                    <div className="original-copy">
                      <span className="eyebrow">
                        {languageName(sourceLanguage)} · ORIGINAL
                      </span>
                      <strong>{shot.title || "No headline"}</strong>
                      <p>{shot.subtitle || "No supporting text"}</p>
                    </div>
                    {selectedLocale && (
                      <div className="translated-copy">
                        <label className="field">
                          Headline
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
                          Supporting text
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
                            ? "Reviewed"
                            : "Mark as reviewed"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          {selectedLocale && (
            <div className="language-remove">
              {deleting === selectedLocale ? (
                <div role="alert">
                  <p>
                    Remove {languageName(selectedLocale)} and its text and image
                    overrides? Your other languages stay. You can undo this.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setDeleting(null)}
                  >
                    Keep language
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      onEdit((draft) => removeLanguage(draft, selectedLocale));
                      onLocale(null);
                      setDeleting(null);
                    }}
                  >
                    Remove language
                  </button>
                </div>
              ) : (
                <button
                  className="text-button"
                  onClick={() => setDeleting(selectedLocale)}
                >
                  <Icon name="trash" size={15} />
                  Remove this language
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      <footer className="languages-footer">
        <p>
          <Icon name="folder" size={16} />
          Saved on this device · Included in your project file
        </p>
        <button className="button primary" onClick={onClose}>
          Done
        </button>
      </footer>
      {downloadOpen && selectedLocale && (
        <TranslatorDialog
          project={project}
          locale={selectedLocale}
          onClose={() => setDownloadOpen(false)}
          onApply={(entries) => {
            onEdit((draft) =>
              applyTranslations(draft, selectedLocale, entries),
            );
            setDownloadOpen(false);
            setNotice(
              "Translation drafts are ready. Review the wording and check each slide in the editor.",
            );
          }}
        />
      )}
    </dialog>
  );
}

function TranslatorDialog({
  project,
  locale,
  onClose,
  onApply,
}: {
  project: Project;
  locale: string;
  onClose: () => void;
  onApply: (entries: import("../core/localization").TranslationDraft[]) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useModal(ref);
  const controller = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<boolean[]>([]);
  const [replace, setReplace] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [clearing, setClearing] = useState(false);
  const route = translationRoute(project.localization!.source, locale);
  const available =
    typeof WebAssembly !== "undefined" && typeof Worker !== "undefined";
  const eligible = project.shots.filter(
    (shot) => replace || localeStatus(shot, locale) === "untranslated",
  );
  const totalBytes =
    route?.reduce(
      (sum, pack, index) => sum + (cached[index] ? 0 : pack.bytes),
      0,
    ) ?? 0;
  const allCached =
    !!route && cached.length === route.length && cached.every(Boolean);
  useEffect(() => {
    let active = true;
    if (route)
      void downloadedPacks(route).then((value) => {
        if (active) setCached(value);
      });
    return () => {
      active = false;
      controller.current?.abort();
    };
    // The dialog owns one fixed source/target pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function translate() {
    if (!route || progress) return;
    const run = new AbortController();
    controller.current = run;
    setError(null);
    setProgress({
      phase: "download",
      message: "Starting your local translator…",
    });
    try {
      const entries = eligible.map((shot) => ({
        shotId: shot.id,
        title: shot.title,
        subtitle: shot.subtitle,
        sourceTitle: shot.title,
        sourceSubtitle: shot.subtitle,
      }));
      const translated = await translateLocally(
        { packs: route, entries },
        run.signal,
        setProgress,
      );
      if (!run.signal.aborted) onApply(translated);
    } catch (error) {
      if (!run.signal.aborted) setError(errorMessage(error));
    } finally {
      if (!run.signal.aborted) {
        setProgress(null);
        controller.current = null;
      }
    }
  }
  function cancel() {
    controller.current?.abort();
    controller.current = null;
    onClose();
  }
  return (
    <dialog
      ref={ref}
      className="translator-dialog"
      aria-labelledby="translator-title"
      aria-describedby="translator-copy"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <header className="translator-heading">
        <span className="eyebrow">OPTIONAL · FREE TO USE</span>
        <button
          className="icon-button"
          aria-label="Close translator"
          onClick={cancel}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="translator-route" aria-hidden="true">
        <span>{project.localization!.source.toUpperCase()}</span>
        <Icon name="arrow" size={22} />
        <span>{locale.toUpperCase()}</span>
      </div>
      <h2 id="translator-title">Translate on your device.</h2>
      <p id="translator-copy">
        Get a first draft, then make it yours. Your captions are translated
        locally and stay on your device.
      </p>
      {route && available ? (
        <>
          <div className="translator-download">
            <Icon name={allCached ? "check" : "download"} size={24} />
            <div>
              <strong>
                {allCached
                  ? "Language packs are saved"
                  : `About ${Math.ceil(totalBytes / 1_000_000)} MB of language packs`}
              </strong>
              <p>
                {allCached
                  ? "Ready to reuse in this browser."
                  : "Downloaded only when you choose. Additional shared runtime files are needed the first time."}
              </p>
            </div>
          </div>
          <ul className="translator-facts">
            <li>No account, API key or payment needed.</li>
            <li>
              Packs are cached in this browser when storage allows. Clearing
              browser data may remove them.
            </li>
            <li>
              Keep this window open while translating. You can cancel at any
              time.
            </li>
          </ul>
          {route.length > 1 && (
            <p className="field-help">
              This pair translates through English using two language packs.
              Review the result carefully.
            </p>
          )}
          {project.shots.some(
            (shot) => localeStatus(shot, locale) !== "untranslated",
          ) && (
            <label className="check-field translator-replace">
              <input
                type="checkbox"
                checked={replace}
                disabled={!!progress || clearing}
                onChange={(event) => setReplace(event.target.checked)}
              />
              Replace existing translations too
            </label>
          )}
          {project.shots.some(
            (shot) => localeStatus(shot, locale) !== "untranslated",
          ) && (
            <p className="field-help">
              {replace
                ? "This replaces every translation in this language, including reviewed text. You can undo the whole batch."
                : "Only untranslated slides will change. Your edited and reviewed translations stay."}
            </p>
          )}
          {error && (
            <p className="translator-error" role="alert">
              {error}
            </p>
          )}
          {progress ? (
            <div className="translator-progress">
              <p role="status">{progress.message}</p>
              <progress
                max={100}
                value={progress.percent}
                aria-label={
                  progress.phase === "download"
                    ? "Translator download"
                    : "Translation progress"
                }
              />
              <button className="button secondary full" onClick={cancel}>
                Cancel · keep my text
              </button>
            </div>
          ) : (
            <div className="translator-actions">
              <button
                className="button primary full"
                disabled={!eligible.length || clearing}
                onClick={() => void translate()}
              >
                <Icon name={allCached ? "languages" : "download"} />
                {eligible.length
                  ? `${allCached ? "Translate" : "Download & translate"} ${eligible.length} ${eligible.length === 1 ? "slide" : "slides"}`
                  : "All slides translated"}
              </button>
              <button className="button secondary full" onClick={onClose}>
                I'll translate manually
              </button>
            </div>
          )}
          {!eligible.length && !progress && (
            <p className="field-help">
              All slides already have translations. Enable replacement to
              generate new drafts.
            </p>
          )}
        </>
      ) : (
        <div className="translator-unavailable">
          <p>
            {!route
              ? "Downloadable translation currently supports English, Spanish, French and German. You can write this language’s captions manually."
              : "The local translator cannot start in this browser. You can still write and export every language manually."}
          </p>
          <button className="button primary full" onClick={onClose}>
            Continue manually
          </button>
        </div>
      )}
      <details className="translator-details">
        <summary>About the translator &amp; storage</summary>
        <p>
          Powered by OPUS-MT models from Helsinki-NLP, converted for the browser
          by Xenova, using Transformers.js. Model files download from Hugging
          Face and runtime files from jsDelivr. Your captions are not sent to
          these services.
        </p>
        <p>
          Download and speed depend on your connection and device. Translation
          is a draft, especially for short marketing headlines.
        </p>
        {route?.map((pack) => (
          <a
            key={pack.id}
            href={`https://huggingface.co/${pack.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {pack.id.replace("Xenova/opus-mt-", "OPUS-MT ")} · model details ↗
          </a>
        ))}
        <a
          href="https://github.com/Helsinki-NLP/OPUS-MT-train"
          target="_blank"
          rel="noopener noreferrer"
        >
          OPUS-MT credits &amp; licenses ↗
        </a>
        <button
          className="text-button"
          disabled={!!progress || clearing}
          onClick={async () => {
            setClearing(true);
            setError(null);
            try {
              await clearTranslationCache();
              setCached([]);
              setCleared(true);
            } catch {
              setError(
                "Browser storage could not be cleared. Try clearing this site’s cached data in your browser settings.",
              );
            } finally {
              setClearing(false);
            }
          }}
        >
          <Icon name="trash" size={14} />
          {clearing ? "Removing downloads…" : "Remove translator downloads"}
        </button>
        {cleared && (
          <p role="status">
            Translator downloads removed. Your projects and translations are
            safe.
          </p>
        )}
      </details>
    </dialog>
  );
}
