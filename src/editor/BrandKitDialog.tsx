import { useEffect, useMemo, useRef, useState } from "react";
import {
  brandFonts,
  newBrandKit,
  validateBrandKit,
  type BrandKit,
} from "../core/brand-kit";
import {
  appliedBrand,
  applyBrandKit,
  brandFromSlide,
} from "../core/brand-application";
import {
  createProject,
  createShot,
  errorMessage,
  type Project,
  type Shot,
} from "../core/model";
import { panoramaPair } from "../core/panorama";
import {
  deleteBrandKit,
  listBrandKits,
  saveBrandKit,
} from "../storage/repository";
import { exportBrandKit, importBrandKit } from "../storage/brand-backup";
import { importBrandLogo } from "../assets/brand-logo";
import { ensureSceneFonts } from "../rendering/fonts";
import { download, filename } from "../platform/download";
import { Icon } from "../app/Icon";
import { Preview } from "./Preview";
import "./brand-kits.css";

export function BrandBadge({ kit }: { kit: BrandKit }) {
  return (
    <span
      className="brand-kit-badge"
      style={{ background: kit.colors.background, color: kit.colors.text }}
    >
      {kit.logo ? (
        <img src={kit.logo} alt="" />
      ) : (
        <span>{kit.name.trim().slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function ConfirmBrandAction({
  kind,
  name,
  onCancel,
  onConfirm,
}: {
  kind: "discard" | "delete";
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="brand-confirm"
      role="alertdialog"
      aria-labelledby="brand-confirm-title"
      aria-describedby="brand-confirm-copy"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="brand-confirm-title">
        {kind === "delete"
          ? "Delete this brand kit?"
          : "Discard unsaved changes?"}
      </h2>
      <p id="brand-confirm-copy">
        {kind === "delete"
          ? `“${name}” will be removed from your library. Projects keep their applied copies.`
          : "Your changes to this kit have not been saved."}
      </p>
      <div>
        <button className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" onClick={onConfirm}>
          {kind === "delete" ? "Delete kit" : "Discard changes"}
        </button>
      </div>
    </dialog>
  );
}

export function BrandKitDialog({
  project,
  shot,
  images,
  onApply,
  onClose,
}: {
  project: Project | null;
  shot?: Shot;
  images: Map<string, HTMLImageElement>;
  onApply: (kit: BrandKit, all: boolean) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [draft, setDraft] = useState<BrandKit | null>(null);
  const [baseline, setBaseline] = useState("");
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState(shot ? "slide" : "series");
  const [pending, setPending] = useState<{
    kind: "discard" | "delete";
    run: () => void;
  } | null>(null);
  const dirty =
    !!draft && (revision === 0 || JSON.stringify(draft) !== baseline);
  useEffect(() => {
    if (dirty) setMessage("");
  }, [dirty]);
  const currentBrand = project ? appliedBrand(project, shot) : undefined;
  const [initialBrandId] = useState(currentBrand?.id);
  const pair = project && shot ? panoramaPair(project, shot.id) : null;

  function choose(kit: BrandKit | null, storedRevision = kit?.revision ?? 0) {
    setDraft(kit ? structuredClone(kit) : null);
    setRevision(storedRevision);
    setBaseline(kit ? JSON.stringify(kit) : "");
    setError("");
    setMessage("");
  }
  function request(action: () => void) {
    if (working) return;
    if (dirty) setPending({ kind: "discard", run: action });
    else action();
  }
  function create(fromSlide = false) {
    choose(
      fromSlide && project ? brandFromSlide(project, shot) : newBrandKit(),
      0,
    );
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  useEffect(() => {
    const dialog = dialogRef.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    let canceled = false;
    listBrandKits()
      .then((items) => {
        if (canceled) return;
        setKits(items);
        choose(
          items.find((item) => item.id === initialBrandId) ?? items[0] ?? null,
        );
      })
      .catch((error) => {
        if (!canceled) setError(errorMessage(error));
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [initialBrandId]);

  const preview = useMemo(() => {
    if (!draft) return null;
    const kit = { ...draft, name: draft.name.trim() || "My app" };
    try {
      validateBrandKit(kit);
    } catch {
      return null;
    }
    const document = project
      ? structuredClone(project)
      : createProject(kit.name);
    if (!document.shots.length)
      document.shots.push(createShot("brand-preview", 0));
    const selected =
      document.shots.find((item) => item.id === shot?.id) ?? document.shots[0];
    applyBrandKit(document, kit, selected.id, scope === "series");
    return {
      project: document,
      shot: selected,
      pair: panoramaPair(document, selected.id),
    };
  }, [draft, project, shot, scope]);
  useEffect(() => {
    if (!preview) return;
    let canceled = false;
    ensureSceneFonts(preview.project, preview.shot).catch((error) => {
      if (!canceled) setError(errorMessage(error));
    });
    return () => {
      canceled = true;
    };
  }, [preview]);

  async function perform(action: () => Promise<void>) {
    setWorking(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setWorking(false);
    }
  }
  async function save() {
    if (!draft) return;
    await perform(async () => {
      const saved = await saveBrandKit(draft, revision);
      setKits((items) => [
        saved,
        ...items.filter((item) => item.id !== saved.id),
      ]);
      choose(saved);
      setMessage("Brand kit saved. Apply it whenever you’re ready.");
    });
  }
  async function restore(file?: File) {
    if (!file) return;
    await perform(async () => {
      const saved = await saveBrandKit(await importBrandKit(file), 0);
      setKits((items) => [saved, ...items]);
      choose(saved);
      setMessage("Brand kit imported as a new copy.");
    });
  }
  function recover() {
    if (!currentBrand) return;
    const identity = newBrandKit(currentBrand.name);
    choose(
      {
        ...structuredClone(currentBrand),
        id: identity.id,
        revision: 1,
        createdAt: identity.createdAt,
        updatedAt: identity.updatedAt,
      },
      0,
    );
  }
  const canRecover =
    currentBrand &&
    !kits.some(
      (kit) =>
        kit.id === currentBrand.id && kit.revision === currentBrand.revision,
    );

  return (
    <>
      <dialog
        ref={dialogRef}
        className="brand-kits-dialog"
        aria-labelledby="brand-kits-title"
        aria-describedby="brand-kits-description"
        onCancel={(event) => {
          event.preventDefault();
          request(onClose);
        }}
      >
        <header className="brand-kits-heading">
          <div>
            <p className="eyebrow">ONE APP. A RECOGNIZABLE LOOK.</p>
            <h2 id="brand-kits-title">Brand kits</h2>
            <p id="brand-kits-description">
              Your apps’ colors and typography, ready for every project.
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Close brand kits"
            disabled={working}
            onClick={() => request(onClose)}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="brand-kits-toolbar">
          <button
            className="button secondary"
            disabled={working || loading}
            onClick={() => request(() => create())}
          >
            <Icon name="plus" size={16} />
            New kit
          </button>
          {project && (
            <button
              className="button secondary"
              disabled={working || loading}
              onClick={() => request(() => create(true))}
            >
              From {shot ? "slide" : "design"}
            </button>
          )}
          <button
            className="button secondary"
            disabled={working || loading}
            onClick={() => request(() => importRef.current?.click())}
          >
            <Icon name="upload" size={16} />
            Import kit
          </button>
          <span>Saved on this device</span>
        </div>
        <input
          ref={importRef}
          className="visually-hidden"
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          accept=".henbrand"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void restore(file);
          }}
        />
        <input
          ref={logoRef}
          className="visually-hidden"
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file)
              void perform(async () => {
                const logo = await importBrandLogo(file);
                setDraft((kit) => (kit ? { ...kit, logo } : null));
              });
          }}
        />
        <div className="brand-kits-body">
          <aside className="brand-kits-library" aria-label="Saved brand kits">
            <div className="brand-kits-library-title">
              <h3>Your brands</h3>
              <span>{kits.length}</span>
            </div>
            <label className="brand-kits-mobile-select">
              Choose a brand
              <select
                disabled={working || loading}
                value={revision ? (draft?.id ?? "") : ""}
                onChange={(event) => {
                  const kit = kits.find(
                    (item) => item.id === event.target.value,
                  );
                  if (kit) request(() => choose(kit));
                }}
              >
                <option value="" disabled>
                  {draft ? "New kit" : "Select a kit"}
                </option>
                {kits.map((kit) => (
                  <option key={kit.id} value={kit.id}>
                    {kit.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="brand-kits-list">
              {kits.map((kit) => (
                <button
                  className="brand-kit-choice"
                  key={kit.id}
                  aria-pressed={draft?.id === kit.id && revision > 0}
                  disabled={working}
                  onClick={() => request(() => choose(kit))}
                >
                  <BrandBadge kit={kit} />
                  <span>
                    <strong>{kit.name}</strong>
                    <span className="brand-mini-palette" aria-hidden="true">
                      {Object.values(kit.colors).map((color, index) => (
                        <i key={index} style={{ background: color }} />
                      ))}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {!loading && !kits.length && (
              <p className="brand-library-note">
                Save a kit once. Reuse it across store listings and portfolios.
              </p>
            )}
            {canRecover && (
              <button
                className="button secondary brand-recover"
                disabled={working}
                onClick={() => request(recover)}
              >
                <Icon name="copy" size={15} />
                Recover project’s brand
              </button>
            )}
          </aside>
          <div className="brand-kits-content">
            {error && (
              <p className="brand-kit-notice error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="brand-kit-notice" role="status">
                {message}
              </p>
            )}
            {loading ? (
              <p role="status">Opening your brands…</p>
            ) : !draft ? (
              <div className="brand-kits-empty">
                <Icon name="brand" size={38} />
                <h3>A familiar look, every time.</h3>
                <p>
                  Keep your app’s colors, logo and fonts together. Start fresh
                  or save a design you already love.
                </p>
                <button
                  className="button primary"
                  onClick={() => create(!!project)}
                >
                  {project
                    ? "Create from this design"
                    : "Create your first kit"}
                </button>
              </div>
            ) : (
              <div className="brand-kit-editor">
                <form
                  id="brand-kit-form"
                  className="brand-kit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  <fieldset disabled={working}>
                    <div className="brand-kit-form-heading">
                      <span className="eyebrow">
                        {revision ? "EDIT BRAND" : "NEW BRAND"}
                      </span>
                      {revision > 0 && (
                        <div>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label="Export brand kit"
                            disabled={dirty}
                            onClick={() => {
                              download(
                                exportBrandKit(draft),
                                `${filename(draft.name)}.henbrand`,
                              );
                              setMessage(
                                "Brand kit exported. Check your downloads.",
                              );
                            }}
                          >
                            <Icon name="download" size={18} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            aria-label="Delete brand kit"
                            onClick={() =>
                              setPending({
                                kind: "delete",
                                run: () => {
                                  void perform(async () => {
                                    await deleteBrandKit(draft.id, revision);
                                    const remaining = kits.filter(
                                      (kit) => kit.id !== draft.id,
                                    );
                                    setKits(remaining);
                                    choose(remaining[0] ?? null);
                                    setMessage(
                                      "Brand kit deleted. Applied project copies are unchanged.",
                                    );
                                  });
                                },
                              })
                            }
                          >
                            <Icon name="trash" size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                    <label className="brand-kit-field">
                      App / brand name
                      <input
                        ref={nameRef}
                        required
                        maxLength={80}
                        value={draft.name}
                        onChange={(event) =>
                          setDraft({ ...draft, name: event.target.value })
                        }
                      />
                    </label>
                    <div className="brand-logo-field">
                      <BrandBadge kit={draft} />
                      <div>
                        <span>App icon / logo</span>
                        <div>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => logoRef.current?.click()}
                          >
                            {draft.logo ? "Replace logo" : "Add logo"}
                          </button>
                          {draft.logo && (
                            <button
                              type="button"
                              className="text-button"
                              onClick={() => {
                                const { logo: _logo, ...next } = draft;
                                setDraft(next);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="brand-field-hint">
                      Identifies your kit. PNG, JPG or WebP, up to 5 MB.
                    </p>
                    <h3>Color palette</h3>
                    <div className="brand-color-grid">
                      {(
                        [
                          ["background", "Background"],
                          ["text", "Text"],
                          ["accent", "Accent"],
                          ["secondary", "Secondary"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <span>
                            <input
                              type="color"
                              aria-label={`Brand ${label.toLowerCase()} color`}
                              value={
                                /^#[\da-f]{6}$/i.test(draft.colors[key])
                                  ? draft.colors[key]
                                  : "#000000"
                              }
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  colors: {
                                    ...draft.colors,
                                    [key]: event.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              aria-label={`Brand ${label.toLowerCase()} hex`}
                              required
                              pattern="#[a-fA-F0-9]{6}"
                              maxLength={7}
                              value={draft.colors[key]}
                              onChange={(event) =>
                                setDraft({
                                  ...draft,
                                  colors: {
                                    ...draft.colors,
                                    [key]: event.target.value,
                                  },
                                })
                              }
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                    <h3>Typography</h3>
                    <div className="brand-font-fields">
                      {(
                        [
                          ["title", "Headlines"],
                          ["body", "Supporting text"],
                        ] as const
                      ).map(([key, label]) => (
                        <label className="brand-kit-field" key={key}>
                          {label}
                          <select
                            value={draft.fonts[key]}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                fonts: {
                                  ...draft.fonts,
                                  [key]: event.target
                                    .value as BrandKit["fonts"][typeof key],
                                },
                              })
                            }
                          >
                            {brandFonts.map((font) => (
                              <option key={font} value={font}>
                                {font}
                                {font === "Manrope"
                                  ? " · Sans serif"
                                  : " · Serif"}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </form>
                <section
                  className="brand-kit-preview"
                  aria-label="Brand preview"
                >
                  <div className="brand-kit-preview-heading">
                    <span className="eyebrow">
                      {project && shot
                        ? "ON YOUR SCREENSHOT"
                        : "YOUR BRAND AT A GLANCE"}
                    </span>
                    <span>Preview</span>
                  </div>
                  {preview && shot && images.get(shot.assetId) ? (
                    <div
                      className={`brand-scene-preview ${preview.pair ? "is-pair" : ""}`}
                    >
                      {(preview.pair ?? [preview.shot]).map((item) => (
                        <Preview
                          key={item.id}
                          project={preview.project}
                          shot={item}
                          image={images.get(item.assetId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="brand-type-preview"
                      style={{
                        background: draft.colors.background,
                        color: draft.colors.text,
                      }}
                    >
                      <BrandBadge kit={draft} />
                      <strong style={{ fontFamily: draft.fonts.title }}>
                        {draft.name.trim() || "Your app"}
                        <br />
                        Feels like you.
                      </strong>
                      <p style={{ fontFamily: draft.fonts.body }}>
                        A little personality. A consistent story.
                      </p>
                      <span
                        style={{
                          background: draft.colors.accent,
                          color: draft.colors.background,
                        }}
                      >
                        Made with care
                      </span>
                      <div style={{ background: draft.colors.secondary }} />
                    </div>
                  )}
                  <p>
                    Colors and fonts adapt to your design. The logo identifies
                    the kit; it is not added to slides.
                  </p>
                  {project && (
                    <p>
                      Applying keeps your words, images, layout and export size.
                      Undo anytime.
                    </p>
                  )}
                  {currentBrand?.id === draft.id &&
                    currentBrand.revision !== revision &&
                    revision > 0 && (
                      <p className="brand-version-note">
                        This project uses an earlier copy. Apply this kit to
                        update it.
                      </p>
                    )}
                </section>
              </div>
            )}
          </div>
        </div>
        <footer className="brand-kits-footer">
          <div>
            <button
              type="submit"
              form="brand-kit-form"
              className={`button ${project ? "secondary" : "primary"}`}
              disabled={!draft || !dirty || working}
              aria-label={
                working ? "Working…" : revision ? "Save changes" : "Save kit"
              }
            >
              <span className="brand-save-full">
                {working ? "Working…" : revision ? "Save changes" : "Save kit"}
              </span>
              <span className="brand-save-short" aria-hidden="true">
                {working ? "Saving…" : "Save"}
              </span>
            </button>
            <small>
              {dirty
                ? "Save before applying or exporting."
                : "Saved kits never update projects automatically."}
            </small>
          </div>
          {project && (
            <div className="brand-apply-controls">
              <label>
                Apply to
                <select
                  aria-label="Apply brand to"
                  disabled={working}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                >
                  {shot && (
                    <option value="slide">
                      {pair ? "Linked pair" : "This slide"}
                    </option>
                  )}
                  <option value="series">
                    {project.shots.length
                      ? `Entire series · ${project.shots.length}`
                      : "Project style"}
                  </option>
                </select>
              </label>
              <button
                className="button primary"
                disabled={!draft || dirty || working || loading}
                onClick={() => {
                  if (draft) onApply(draft, scope === "series");
                }}
              >
                Apply brand
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
        </footer>
      </dialog>
      {pending && (
        <ConfirmBrandAction
          kind={pending.kind}
          name={draft?.name ?? ""}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const action = pending.run;
            setPending(null);
            action();
          }}
        />
      )}
    </>
  );
}
