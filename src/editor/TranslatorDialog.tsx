import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../app/Icon";
import { errorMessage, type Project } from "../core/model";
import { languageName, type TranslationDraft } from "../core/localization";
import { useT } from "../i18n/react";
import { translationRoute } from "../translation/catalog";
import {
  clearTranslationCache,
  downloadedPacks,
  type TranslationProgress,
} from "../translation/client";
import {
  languageJobs,
  translateLanguages,
  uniquePacks,
} from "../translation/batch";
import { useModal } from "./useModal";

export function TranslatorDialog({
  project,
  onClose,
  onApply,
}: {
  project: Project;
  onClose: () => void;
  onApply: (locale: string, entries: TranslationDraft[]) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);
  useModal(ref);
  // The modal locks a snapshot while completed languages update the parent editor.
  const [snapshot] = useState(() => structuredClone(project));
  const source = snapshot.localization!.source;
  const targets = snapshot.localization!.targets;
  const [selected, setSelected] = useState(() =>
    targets.filter((code) => translationRoute(source, code)),
  );
  const [replace, setReplace] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const available =
    typeof WebAssembly !== "undefined" && typeof Worker !== "undefined";
  const allPacks = useMemo(
    () => uniquePacks(languageJobs(snapshot, targets, true)),
    [snapshot, targets],
  );
  const jobs = useMemo(
    () =>
      languageJobs(snapshot, selected, replace).filter(
        (job) => !completed.includes(job.locale),
      ),
    [snapshot, selected, replace, completed],
  );
  const packs = uniquePacks(jobs);
  const downloadBytes = packs.reduce(
    (sum, pack) => sum + (cached.includes(pack.id) ? 0 : pack.bytes),
    0,
  );
  const count = jobs.reduce((sum, job) => sum + job.entries.length, 0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (running) return;
    let alive = true;
    setChecking(true);
    void downloadedPacks(allPacks).then((found) => {
      if (alive) {
        setCached(
          allPacks.filter((_, index) => found[index]).map((pack) => pack.id),
        );
        setChecking(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [allPacks, running]);

  async function start() {
    if (controller.current || !jobs.length) return;
    const run = new AbortController();
    controller.current = run;
    setError(null);
    setStopped(false);
    setFinished(false);
    setRunning(true);
    setActive(jobs[0].locale);
    setProgress({
      phase: "download",
      message: "Starting your local translator…",
    });
    try {
      await translateLanguages(
        jobs,
        run.signal,
        (locale, next) => {
          setActive(locale);
          setProgress(next);
        },
        (locale, entries) => {
          onApply(locale, entries);
          setCompleted((previous) => [...previous, locale]);
        },
      );
      setFinished(true);
    } catch (error) {
      if (run.signal.aborted) setStopped(true);
      else setError(errorMessage(error));
    } finally {
      setRunning(false);
      setProgress(null);
      controller.current = null;
    }
  }
  function close() {
    controller.current?.abort();
    onClose();
  }
  const canConfigure = !running && !completed.length;
  return (
    <dialog
      ref={ref}
      className="translator-dialog"
      aria-labelledby="translator-title"
      aria-describedby="translator-copy"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
    >
      <header className="translator-heading">
        <h2 id="translator-title">{t("Translate with AI")}</h2>
        <button
          className="icon-button"
          aria-label={t("Close translator")}
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="translator-body">
        <p id="translator-copy">
          {t(
            "Choose languages for the whole series. Each slide is translated separately, then you review the wording.",
          )}
        </p>
        <p className="translator-source">
          {t("Original language: {language}", {
            language: languageName(source),
          })}
        </p>
        <fieldset
          className="translator-languages"
          disabled={running || finished}
        >
          <legend>{t("Translate into")}</legend>
          {targets.map((code) => {
            const supported = !!translationRoute(source, code);
            const done = completed.includes(code);
            const eligible =
              languageJobs(snapshot, [code], replace)[0]?.entries.length ?? 0;
            return (
              <label
                className={`translator-language ${active === code && running ? "is-running" : ""}`}
                key={code}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(code)}
                  disabled={!supported || done || !eligible}
                  onChange={(event) => {
                    setSelected((previous) =>
                      event.target.checked
                        ? [...previous, code]
                        : previous.filter((id) => id !== code),
                    );
                    setError(null);
                    setStopped(false);
                  }}
                />
                <span>
                  <strong>{languageName(code)}</strong>
                  <small>
                    {!supported
                      ? t("Manual editing · no local model")
                      : done
                        ? t("Drafts saved")
                        : !eligible
                          ? t("No untranslated slides")
                          : t(
                              replace
                                ? "Slides to translate: {count}"
                                : "Untranslated slides: {count}",
                              { count: eligible },
                            )}
                  </small>
                </span>
                {done && <Icon name="check" size={18} />}
                {active === code && running && (
                  <span className="translation-status">{t("In progress")}</span>
                )}
              </label>
            );
          })}
        </fieldset>
        <label className="check-field translator-replace">
          <input
            type="checkbox"
            checked={replace}
            disabled={!canConfigure || !available}
            onChange={(event) => {
              setReplace(event.target.checked);
              setError(null);
              setStopped(false);
            }}
          />
          {t("Replace existing translations too")}
        </label>
        <p className="field-help">
          {replace
            ? t(
                "This replaces edited and reviewed text in the selected languages. You can undo each completed language.",
              )
            : t(
                "Only untranslated slides will change. Your edited and reviewed translations stay.",
              )}
        </p>
        <div className="translator-download">
          <Icon name="download" size={22} />
          <div>
            <strong>
              {checking
                ? t("Checking saved language packs…")
                : downloadBytes
                  ? t("About {size} MB of language packs", {
                      size: Math.ceil(downloadBytes / 1_000_000),
                    })
                  : t("No new language packs needed")}
            </strong>
            <p>
              {t(
                "Downloaded only when you start. Shared packs are counted once; runtime files are also needed the first time.",
              )}
            </p>
          </div>
        </div>
        <p className="translator-privacy">
          {t(
            "Free local AI · OPUS-MT. Your captions stay on this device. Text inside uploaded images is not translated.",
          )}
        </p>
        <p className="field-help">
          {t(
            "One language runs at a time to limit memory use. If you stop, completed languages stay saved; the unfinished language stays unchanged.",
          )}
        </p>
        {error && (
          <p className="translator-error" role="alert">
            {t(error)}{" "}
            {t(
              "Completed languages are saved. Retry to continue with the remaining languages.",
            )}
          </p>
        )}
        {stopped && (
          <p className="language-notice" role="status">
            {t(
              "Translation stopped. Completed languages are saved. You can continue when you are ready.",
            )}
          </p>
        )}
        {finished && (
          <p className="language-notice" role="status">
            {t(
              "Translation drafts are ready. Review the wording and check each slide in the editor.",
            )}
          </p>
        )}
        <details className="translator-details">
          <summary>{t("About the translator & storage")}</summary>
          <p>
            {t(
              "Powered by OPUS-MT models from Helsinki-NLP, converted for the browser by Xenova, using Transformers.js. Model files download from Hugging Face and runtime files from jsDelivr. Your captions are not sent to these services.",
            )}
          </p>
          <p>
            {t(
              "Packs are cached in this browser when storage allows. Clearing browser data may remove them.",
            )}
          </p>
          <p>
            {t(
              "English, Spanish, French, and German support local AI translation. Some pairs use English as an intermediate step. Other languages use manual editing.",
            )}
          </p>
          <a
            href="https://github.com/Helsinki-NLP/OPUS-MT-train"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("OPUS-MT credits & licenses ↗")}
          </a>
          <button
            className="text-button"
            disabled={running || clearing || checking}
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
            {clearing
              ? t("Removing downloads…")
              : t("Remove translator downloads")}
          </button>
          {cleared && (
            <p role="status">
              {t(
                "Translator downloads removed. Your projects and translations are safe.",
              )}
            </p>
          )}
        </details>
      </div>
      {running && progress ? (
        <div className="translator-progress">
          <p role="status">
            <strong>
              {languageName(active!)} ·{" "}
              {t("Languages completed: {count}", { count: completed.length })}
            </strong>
            <br />
            {t(progress.message)}
          </p>
          <progress
            max={100}
            value={progress.percent}
            aria-label={
              progress.phase === "download"
                ? t("Translator download")
                : t("Translation progress")
            }
          />
          <button
            className="button secondary full"
            onClick={() => controller.current?.abort()}
          >
            {t("Stop translation")}
          </button>
        </div>
      ) : (
        <div className="translator-actions">
          {!available && (
            <p className="translator-unavailable">
              {t(
                "The local translator cannot start in this browser. You can still write and export every language manually.",
              )}
            </p>
          )}
          {!finished && (
            <p className="field-help">
              {t("Slide translations: {count} · Languages: {languages}", {
                count,
                languages: jobs.length,
              })}
            </p>
          )}
          {!finished && (
            <button
              className="button primary full"
              disabled={!available || !jobs.length || checking || clearing}
              onClick={() => void start()}
            >
              <Icon name="languages" />
              {error || stopped
                ? t("Continue translation")
                : t("Start AI translation")}
            </button>
          )}
          {!jobs.length && !finished && (
            <p className="field-help">
              {t(
                "Select a supported language with untranslated slides, or enable replacement to create new drafts.",
              )}
            </p>
          )}
          <button
            className={`button ${finished ? "primary" : "secondary"} full`}
            onClick={close}
          >
            {finished ? t("Review translations") : t("Back to manual editing")}
          </button>
        </div>
      )}
    </dialog>
  );
}
