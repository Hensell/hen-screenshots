import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "../i18n/react";
import { Icon } from "../app/Icon";
import {
  errorMessage,
  type Asset,
  type LoadedProject,
  type Project,
  type Shot,
} from "../core/model";
import { captureTemplate, templateAppendIssue } from "../core/custom-templates";
import { resolveExportProfile } from "../core/export-profiles";
import {
  listCustomTemplates,
  loadCustomTemplate,
  saveCustomTemplate,
  deleteCustomTemplate,
  importCustomTemplate,
  exportCustomTemplate,
  type CustomTemplate,
} from "../storage/custom-templates";
import { download, filename } from "../platform/download";
import { useImages } from "./useImages";
import { Preview } from "./Preview";
import "./my-templates.css";

const emptyAssets: Asset[] = [];
const emptyShots: Shot[] = [];
export function MyTemplatesDialog({
  project,
  shot,
  assets,
  savingInitially = false,
  onClose,
  onUse,
}: {
  project: Project | null;
  shot?: Shot;
  assets: Asset[];
  savingInitially?: boolean;
  onClose: () => void;
  onUse: (template: LoadedProject, newProject: boolean) => Promise<void>;
}) {
  const t = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<CustomTemplate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(savingInitially);
  const [name, setName] = useState(project?.name ?? "");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [removing, setRemoving] = useState(false);
  const [ready, setReady] = useState<{ url: string; name: string } | null>(
    null,
  );
  const { images, error: imageError } = useImages(
    loaded?.assets ?? emptyAssets,
    loaded?.project.shots ?? emptyShots,
  );
  const filtered = useMemo(
    () =>
      records.filter((record) =>
        record.name
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase()),
      ),
    [records, query],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * 20, (currentPage + 1) * 20);
  const canSave =
    !!project && !!shot && !resolveExportProfile(project).sourceOnly;
  const issue =
    project && loaded ? templateAppendIssue(project, loaded.project) : null;
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    let active = true;
    listCustomTemplates()
      .then((items) => {
        if (active) {
          setRecords(items);
          setSelected(items[0]?.id ?? null);
        }
      })
      .catch((error) => {
        if (active) setError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      element.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    let active = true;
    setReady(null);
    setLoaded(null);
    setRemoving(false);
    setError(null);
    if (selected)
      loadCustomTemplate(selected)
        .then((value) => {
          if (active) setLoaded(value);
        })
        .catch((error) => {
          if (active) setError(errorMessage(error));
        });
    return () => {
      active = false;
    };
  }, [selected]);
  useEffect(() => {
    if (saving) nameInput.current?.focus();
  }, [saving]);
  useEffect(
    () => () => {
      if (ready) URL.revokeObjectURL(ready.url);
    },
    [ready],
  );
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function refresh(id?: string) {
    const items = await listCustomTemplates();
    setRecords(items);
    setSelected(id ?? items[0]?.id ?? null);
    setQuery("");
    setPage(0);
  }
  function close() {
    if (!busy) onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="my-templates-dialog"
      aria-labelledby="my-templates-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <header className="my-templates-header">
        <div>
          <h2 id="my-templates-title">{t("My templates")}</h2>
          <p>{t("Your designs, ready for the next app.")}</p>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Close templates")}
          disabled={busy}
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="my-templates-toolbar">
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <Icon name="upload" size={16} />
          {t("Import template")}
        </button>
        {canSave && (
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={() => setSaving((value) => !value)}
          >
            <Icon name="plus" size={16} />
            {t("Save current design")}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          accept=".hentemplate"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file)
              void run(async () => {
                const record = await importCustomTemplate(file);
                await refresh(record.id);
                setMessage("Template imported.");
              });
          }}
        />
      </div>
      <p className="my-templates-note">
        {t(
          "Saved in this browser. Export a template file to back it up or share it. Nothing is published automatically.",
        )}
      </p>
      {saving && canSave && (
        <form
          className="my-template-save"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const source = captureTemplate(project!, shot!.id, name, assets);
              const record = await saveCustomTemplate(source);
              await refresh(record.id);
              setSaving(false);
              setMessage(
                "Template saved. Add new screenshots whenever you use it.",
              );
            });
          }}
        >
          <label>
            {t("Template name")}
            <input
              ref={nameInput}
              value={name}
              maxLength={80}
              required
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <p>
            {t(
              "Keeps the current text, layout, background, and extra images. Device screenshots, other languages, and brand kit details are left out.",
            )}
          </p>
          <div className="my-template-actions">
            <button
              type="submit"
              className="button primary"
              disabled={busy || !name.trim()}
            >
              {t("Save template")}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setSaving(false)}
            >
              {t("Cancel")}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p className="my-template-message error" role="alert">
          {t(error)}
        </p>
      )}
      {(message || busy) && (
        <p className="my-template-message" role="status">
          {t(busy ? "Working…" : message!)}
        </p>
      )}
      {ready && (
        <a
          className="my-template-download"
          href={ready.url}
          download={ready.name}
        >
          {t("Download template file")} <Icon name="download" size={16} />
        </a>
      )}
      <div className="my-templates-body">
        <section
          className="my-templates-list"
          aria-label={t("Saved templates")}
        >
          <label className="my-template-search">
            {t("Search my templates")}
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
          </label>
          {loading ? (
            <p role="status">{t("Loading templates…")}</p>
          ) : !records.length ? (
            <div className="my-templates-empty">
              <Icon name="layout" size={32} />
              <h3>{t("Make a design worth keeping.")}</h3>
              <p>
                {t(
                  "Save a slide or panorama from the editor, or import a .hentemplate file.",
                )}
              </p>
            </div>
          ) : !filtered.length ? (
            <p>{t("No templates match your search.")}</p>
          ) : (
            <>
              <div className="my-template-results">
                {visible.map((record) => {
                  const size = resolveExportProfile(record.project);
                  return (
                    <button
                      type="button"
                      className="my-template-row"
                      key={record.id}
                      aria-pressed={record.id === selected}
                      disabled={busy}
                      onClick={() => {
                        setSelected(record.id);
                        setMessage(null);
                      }}
                    >
                      <Icon name="layout" size={18} />
                      <span>
                        <strong>{record.name}</strong>
                        <small>
                          {size.width} × {size.height} ·{" "}
                          {t(
                            record.project.shots.length === 2
                              ? "2-slide panorama"
                              : "Single slide",
                          )}
                        </small>
                      </span>
                      <Icon name="right" size={16} />
                    </button>
                  );
                })}
              </div>
              {pages > 1 && (
                <nav
                  className="my-template-actions"
                  aria-label={t("Template pages")}
                >
                  <button
                    type="button"
                    className="button secondary"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    {t("Previous")}
                  </button>
                  <span>
                    {currentPage + 1} / {pages}
                  </span>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={currentPage >= pages - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    {t("Next")}
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
        <section
          className="my-template-detail"
          aria-label={t("Template preview")}
          aria-busy={!!selected && !loaded && !error}
        >
          {loaded ? (
            <>
              <div
                style={{
                  maxWidth: `${((loaded.project.shots.length * resolveExportProfile(loaded.project).width) / resolveExportProfile(loaded.project).height) * 320 + 40}px`,
                }}
                className={`my-template-scene ${loaded.project.shots.length === 2 ? "my-template-panorama" : ""}`}
              >
                {imageError ? (
                  <p role="alert">{t(imageError)}</p>
                ) : (
                  loaded.project.shots.map((item) => (
                    <Preview
                      key={item.id}
                      project={loaded.project}
                      shot={item}
                      images={images}
                      small
                    />
                  ))
                )}
              </div>
              <h3>{loaded.project.name}</h3>
              <p>
                {t(
                  "Editable text and artwork. Add your screenshots after opening.",
                )}
              </p>
              {issue && <p className="field-help">{t(issue)}</p>}
              <div className="my-template-actions">
                {project && (
                  <button
                    type="button"
                    className="button primary"
                    disabled={busy || !!issue || !!imageError}
                    onClick={() => void run(() => onUse(loaded, false))}
                  >
                    <Icon name="plus" size={16} />
                    {t("Add to this project")}
                  </button>
                )}
                <button
                  type="button"
                  className={`button ${project ? "secondary" : "primary"}`}
                  disabled={busy || !!imageError}
                  onClick={() => void run(() => onUse(loaded, true))}
                >
                  {t("Open as new project")}
                </button>
              </div>
              <div className="my-template-actions my-template-file-actions">
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const blob = await exportCustomTemplate(selected!);
                      const name = `${filename(loaded.project.name)}.hentemplate`;
                      setReady({ url: URL.createObjectURL(blob), name });
                      download(blob, name);
                      setMessage(
                        "Template exported. Keep the file somewhere safe.",
                      );
                    })
                  }
                >
                  <Icon name="download" size={16} />
                  {t("Export template")}
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => setRemoving(true)}
                >
                  <Icon name="trash" size={16} />
                  {t("Delete template")}
                </button>
              </div>
              {removing && (
                <div
                  className="my-template-delete"
                  role="group"
                  aria-label={t("Delete template?")}
                >
                  <p>
                    {t(
                      "Delete this saved template? Projects that already use it will stay unchanged.",
                    )}
                  </p>
                  <div className="my-template-actions">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() => setRemoving(false)}
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="button"
                      className="button primary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await deleteCustomTemplate(selected!);
                          await refresh();
                          setRemoving(false);
                          setMessage("Template deleted.");
                        })
                      }
                    >
                      {t("Delete template")}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : selected && !error ? (
            <p role="status">{t("Loading templates…")}</p>
          ) : (
            <p>{t("Select a template to see its design.")}</p>
          )}
        </section>
      </div>
    </dialog>
  );
}
