import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { zip } from "fflate";
import mark from "../../brand/mark.svg";
import { createProject, createShot, errorMessage, LIMITS } from "../core/model";
import type { LoadedProject, Project } from "../core/model";
import { importImages, loadImage } from "../assets/import";
import { listProjects, loadProject } from "../storage/repository";
import { exportProject, importProject } from "../storage/backup";
import { renderShot } from "../export/images";
import { download, filename } from "../platform/download";
import { saveNow, useEditor } from "../editor/store";
import { useImages } from "../editor/useImages";
import { Preview } from "../editor/Preview";
import { Inspector } from "../editor/Inspector";
import { Icon } from "./Icon";

type Notice = { message: string; error?: boolean };
type ReadyFile = { url: string; name: string; image: boolean };
function Brand() {
  return (
    <span className="brand">
      <img src={mark} width={32} height={34} alt="" />
      <span>
        hen<span className="brand-word">screenshots</span>
      </span>
    </span>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      <span>Made for the apps you care about.</span>
      <a href="https://hensell.dev" target="_blank" rel="noopener noreferrer">
        By Hensell <Icon name="arrow" size={14} />
      </a>
    </footer>
  );
}

export function App() {
  const state = useEditor();
  const { project, assets, selectedId, status, saveError, change } = state;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [readyFile, setReadyFile] = useState<ReadyFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const replaceId = useRef<string | null>(null);
  const cancelExport = useRef(false);
  const dragCount = useRef(0);
  const { images, error: imageError } = useImages(assets);
  const shot = project?.shots.find((shot) => shot.id === selectedId);

  useEffect(
    () => () => {
      if (readyFile) URL.revokeObjectURL(readyFile.url);
    },
    [readyFile],
  );
  function offerFile(blob: Blob, name: string) {
    setReadyFile({
      url: URL.createObjectURL(blob),
      name,
      image: blob.type === "image/png",
    });
    download(blob, name);
  }

  const open = useCallback((loaded: LoadedProject) => {
    useEditor.getState().open(loaded);
    const url = new URL(window.location.href);
    url.searchParams.set("project", loaded.project.id);
    window.history.replaceState(null, "", url);
    setNotice(null);
    setReadyFile(null);
  }, []);

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) {
      setLoading(false);
      return;
    }
    loadProject(id)
      .then((loaded) => {
        if (active) open(loaded);
      })
      .catch((error) => {
        if (active) setNotice({ message: errorMessage(error), error: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (project) return;
    let active = true;
    listProjects()
      .then((records) => {
        if (active) setProjects(records.map((record) => record.project));
      })
      .catch((error) => {
        if (active)
          setNotice({
            message: `Couldn't open local projects. ${errorMessage(error)}`,
            error: true,
          });
      });
    return () => {
      active = false;
    };
  }, [project?.id]);

  useEffect(() => {
    if (!project || status !== "pending") return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 450);
    return () => clearTimeout(timer);
  }, [project?.id, change, status]);

  useEffect(() => {
    function preventLostChanges(event: BeforeUnloadEvent) {
      const state = useEditor.getState();
      if (state.project && state.change !== state.savedChange) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", preventLostChanges);
    return () => window.removeEventListener("beforeunload", preventLostChanges);
  }, []);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (!useEditor.getState().project || busy || exportOpen) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) useEditor.getState().redo();
        else useEditor.getState().undo();
      }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [busy, exportOpen]);

  async function backToProjects() {
    if (busy) return;
    setBusy("Saving project…");
    if (await saveNow()) {
      state.close();
      const url = new URL(window.location.href);
      url.searchParams.delete("project");
      window.history.replaceState(null, "", url);
      setNotice(null);
    }
    setBusy(null);
  }
  async function openExisting(id: string) {
    setBusy("Opening project…");
    try {
      open(await loadProject(id));
    } catch (error) {
      setNotice({ message: errorMessage(error), error: true });
    } finally {
      setBusy(null);
    }
  }
  function newProject(event?: FormEvent) {
    event?.preventDefault();
    open({ project: createProject(), assets: [], revision: 0 });
  }
  function chooseImages(replace = false) {
    replaceId.current = replace ? (shot?.id ?? null) : null;
    imageInput.current!.multiple = !replace;
    imageInput.current!.click();
  }
  async function addImages(files: File[]) {
    if (!project || busy || !files.length) return;
    const replacement = replaceId.current;
    replaceId.current = null;
    setBusy(replacement ? "Replacing screenshot…" : "Importing screenshots…");
    setNotice(null);
    setReadyFile(null);
    try {
      if (!replacement && project.shots.length + files.length > LIMITS.shots)
        throw new Error(
          `A project can have up to ${LIMITS.shots} screenshots. Import fewer images.`,
        );
      if (replacement && files.length !== 1)
        throw new Error("Choose one image to replace this screenshot.");
      const usedIds = new Set(
        project.shots.filter((s) => s.id !== replacement).map((s) => s.assetId),
      );
      const existingBytes = assets
        .filter((asset) => usedIds.has(asset.id))
        .reduce((sum, asset) => sum + asset.blob.size, 0);
      if (
        existingBytes + files.reduce((sum, file) => sum + file.size, 0) >
        LIMITS.totalBytes
      )
        throw new Error(
          "This project would exceed 120 MB. Choose smaller screenshots.",
        );
      const incoming = await importImages(files);
      state.addAssets(incoming);
      let firstId: string | undefined;
      state.edit((project) => {
        if (replacement) {
          const target = project.shots.find((s) => s.id === replacement);
          if (target) target.assetId = incoming[0].id;
        } else {
          incoming.forEach((asset) => {
            const next = createShot(asset.id, project.shots.length);
            firstId ??= next.id;
            project.shots.push(next);
          });
        }
      });
      if (firstId) state.select(firstId);
      setNotice({
        message: replacement
          ? "Screenshot replaced. Your layout is preserved."
          : `${incoming.length} screenshot${incoming.length === 1 ? "" : "s"} added. Start with the headline.`,
      });
    } catch (error) {
      setNotice({ message: errorMessage(error), error: true });
    } finally {
      setBusy(null);
    }
  }
  async function restore(file?: File) {
    if (!file || busy) return;
    setBusy("Opening project file…");
    try {
      const loaded = await importProject(file);
      open(loaded);
      setNotice({
        message:
          "Project restored as a new copy, including its original screenshots.",
      });
    } catch (error) {
      setNotice({ message: errorMessage(error), error: true });
    } finally {
      setBusy(null);
    }
  }
  async function backup() {
    if (!project || busy) return;
    setBusy("Preparing project file…");
    try {
      offerFile(
        await exportProject(project, assets),
        `${filename(project.name)}.henscreenshots`,
      );
      setNotice({
        message: "Project file ready. Keep it to move or restore your work.",
      });
    } catch (error) {
      setNotice({ message: errorMessage(error), error: true });
    } finally {
      setBusy(null);
    }
  }
  async function exportImages(all: boolean) {
    if (!project || !shot || busy) return;
    const snapshot = structuredClone(project);
    const shots = all
      ? snapshot.shots
      : snapshot.shots.filter((item) => item.id === shot.id);
    cancelExport.current = false;
    setBusy("Preparing export…");
    try {
      const files: Record<string, Uint8Array> = {};
      let png: Blob | undefined;
      for (const [index, item] of shots.entries()) {
        if (cancelExport.current) return;
        setBusy(`Rendering ${index + 1} of ${shots.length}…`);
        const asset = assets.find((asset) => asset.id === item.assetId);
        if (!asset)
          throw new Error(
            `The original image for screenshot ${index + 1} is missing. Replace it and try again.`,
          );
        const image = images.get(asset.id) ?? (await loadImage(asset));
        png = await renderShot(snapshot, item, image);
        files[
          `${String(snapshot.shots.findIndex((s) => s.id === item.id) + 1).padStart(2, "0")}-${filename(item.title)}.png`
        ] = new Uint8Array(await png.arrayBuffer());
      }
      if (cancelExport.current) return;
      if (all) {
        setBusy("Packaging screenshots…");
        const archive = await new Promise<Uint8Array>((resolve, reject) =>
          zip(files, { level: 0 }, (error, result) =>
            error ? reject(error) : resolve(result),
          ),
        );
        if (cancelExport.current) return;
        offerFile(
          new Blob([new Uint8Array(archive)], { type: "application/zip" }),
          `${filename(snapshot.name)}-screenshots.zip`,
        );
      } else if (png)
        offerFile(
          png,
          `${filename(snapshot.name)}-${String(project.shots.findIndex((s) => s.id === shot.id) + 1).padStart(2, "0")}.png`,
        );
      setNotice({
        message: `${all ? "Your screenshot series is" : "Your PNG is"} ready. Check your downloads.`,
      });
    } catch (error) {
      setNotice({
        message: `Export couldn't finish. ${errorMessage(error)}`,
        error: true,
      });
      setExportOpen(false);
    } finally {
      setBusy(null);
    }
  }
  function duplicate() {
    if (!shot || !project || project.shots.length >= LIMITS.shots) return;
    const copy = structuredClone(shot);
    copy.id = crypto.randomUUID();
    state.edit((project) => {
      project.shots.splice(
        project.shots.findIndex((s) => s.id === shot.id) + 1,
        0,
        copy,
      );
    });
    state.select(copy.id);
  }
  function reorder(direction: number) {
    if (!shot) return;
    state.edit((project) => {
      const index = project.shots.findIndex((s) => s.id === shot.id),
        next = index + direction;
      if (next >= 0 && next < project.shots.length)
        [project.shots[index], project.shots[next]] = [
          project.shots[next],
          project.shots[index],
        ];
    });
  }
  const selectedIndex =
    project?.shots.findIndex((s) => s.id === selectedId) ?? -1;
  const savingText =
    status === "saved"
      ? "Saved on this device"
      : status === "error"
        ? "Not saved"
        : "Saving…";
  return (
    <>
      <input
        ref={imageInput}
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addImages(files);
        }}
      />
      <input
        ref={backupInput}
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        type="file"
        accept=".henscreenshots"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void restore(file);
        }}
      />
      <header className={`topbar ${project ? "topbar-editor" : ""}`}>
        {project ? (
          <button
            className="brand-home"
            aria-label="Back to projects"
            disabled={!!busy}
            onClick={() => void backToProjects()}
          >
            <Brand />
          </button>
        ) : (
          <Brand />
        )}
        {project ? (
          <>
            <div className="project-heading">
              <button
                className="icon-button"
                aria-label="Back to projects"
                disabled={!!busy}
                onClick={() => void backToProjects()}
              >
                <Icon name="left" />
              </button>
              <input
                className="project-name"
                aria-label="Project name"
                maxLength={80}
                value={project.name}
                disabled={!!busy}
                onChange={(event) =>
                  state.edit((project) => {
                    project.name = event.target.value;
                  }, "name")
                }
                onBlur={() => {
                  if (!project.name.trim())
                    state.edit((project) => {
                      project.name = "Untitled app";
                    });
                  state.endGroup();
                }}
              />
              <span
                className={`save-status ${status === "error" ? "has-error" : ""}`}
                role="status"
              >
                {status === "saved" && <Icon name="check" size={14} />}
                {savingText}
              </span>
            </div>
            <div className="header-actions">
              <button
                className="button secondary backup-button"
                disabled={!!busy}
                onClick={() => void backup()}
              >
                <Icon name="folder" />
                <span>Project file</span>
              </button>
              <button
                className="button primary"
                disabled={!shot || !!busy || !!imageError}
                onClick={() => {
                  setReadyFile(null);
                  setExportOpen(true);
                }}
              >
                <Icon name="download" />
                Export
              </button>
            </div>
          </>
        ) : (
          <span className="header-note">App screenshot studio</span>
        )}
      </header>
      {notice && (
        <div
          className={`notice ${notice.error ? "notice-error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          <span>{notice.message}</span>
          {readyFile && !notice.error && (
            <a
              className="text-button download-again"
              href={readyFile.url}
              download={readyFile.name}
            >
              Save file
            </a>
          )}
          <button
            className="icon-button"
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {saveError && project && (
        <div className="save-error" role="alert">
          <span>
            <strong>Your changes are still here.</strong> {saveError}
          </span>
          <div>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() => void saveNow()}
            >
              Retry saving
            </button>
            <button
              className="text-button"
              disabled={!!busy || status === "saving"}
              onClick={() => {
                state.saveAsCopy();
                const id = useEditor.getState().project!.id;
                const url = new URL(window.location.href);
                url.searchParams.set("project", id);
                window.history.replaceState(null, "", url);
              }}
            >
              Save as a copy
            </button>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() => void backup()}
            >
              Download project
            </button>
          </div>
        </div>
      )}
      {imageError && project && (
        <div className="notice notice-error" role="alert">
          Couldn't load an image: {imageError}. Replace the affected screenshot
          or reopen the project.
        </div>
      )}
      {loading ? (
        <main className="loading-page" role="status">
          Opening your studio…
        </main>
      ) : !project ? (
        <main className="library">
          <div className="library-intro">
            <p className="eyebrow">YOUR APPS, IN THEIR BEST LIGHT</p>
            <h1>
              A good app deserves
              <br />
              <span>a great first impression.</span>
            </h1>
            <p className="intro-copy">
              Turn your screenshots into a story worth downloading.
              <br className="desktop-break" /> A little framing. The right
              words. All yours.
            </p>
            <div className="library-actions">
              <button
                className="button primary"
                disabled={!!busy}
                onClick={() => newProject()}
              >
                <Icon name="plus" />
                New project
              </button>
              <button
                className="button secondary"
                disabled={!!busy}
                onClick={() => backupInput.current!.click()}
              >
                <Icon name="upload" />
                Open project file
              </button>
            </div>
            <p className="local-note">
              Your screenshots stay in your browser. No account needed.
            </p>
          </div>
          <section className="projects-section" aria-label="Saved projects">
            <div className="section-heading">
              <h2>Your projects</h2>
              <span className="muted">{projects.length} on this device</span>
            </div>
            {projects.length ? (
              <div className="project-grid">
                {projects.map((item) => (
                  <button
                    className="project-card"
                    key={item.id}
                    disabled={!!busy}
                    onClick={() => void openExisting(item.id)}
                  >
                    <div
                      className="project-cover"
                      style={{
                        background: item.style.background,
                        color: item.style.textColor,
                      }}
                    >
                      <span>{item.name || "Untitled app"}</span>
                      <Icon name="phone" size={70} />
                      <span className="cover-rule" />
                    </div>
                    <div className="project-card-details">
                      <span>
                        <strong>{item.name || "Untitled app"}</strong>
                        <small>
                          {item.shots.length} screenshot
                          {item.shots.length === 1 ? "" : "s"} ·{" "}
                          {new Date(item.updatedAt).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                          })}
                        </small>
                      </span>
                      <Icon name="arrow" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-library">
                <Icon name="folder" size={28} />
                <div>
                  <h3>A place for your next launch.</h3>
                  <p>
                    Your projects will appear here, ready to pick up where you
                    left off.
                  </p>
                </div>
              </div>
            )}
          </section>
          <Footer />
        </main>
      ) : (
        <main
          className={`studio ${dragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            if (event.dataTransfer.types.includes("Files")) {
              event.preventDefault();
              dragCount.current++;
              setDragging(true);
            }
          }}
          onDragLeave={() => {
            dragCount.current--;
            if (dragCount.current <= 0) {
              dragCount.current = 0;
              setDragging(false);
            }
          }}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes("Files"))
              event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragCount.current = 0;
            setDragging(false);
            replaceId.current = null;
            void addImages(Array.from(event.dataTransfer.files));
          }}
        >
          <aside className="filmstrip" aria-label="Screenshot series">
            <div className="filmstrip-heading">
              <h2>Series</h2>
              <span>
                {project.shots.length}/{LIMITS.shots}
              </span>
            </div>
            <div className="shot-list">
              {project.shots.map((item, index) => (
                <button
                  className={`shot-thumbnail ${item.id === selectedId ? "selected" : ""}`}
                  aria-label={`Select screenshot ${index + 1}: ${item.title.replace(/\n/g, " ")}`}
                  aria-current={item.id === selectedId ? "true" : undefined}
                  key={item.id}
                  disabled={!!busy}
                  onClick={() => state.select(item.id)}
                >
                  <Preview
                    project={project}
                    shot={item}
                    image={images.get(item.assetId)}
                    small
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
              <button
                className="add-shot"
                disabled={!!busy || project.shots.length >= LIMITS.shots}
                onClick={() => chooseImages()}
              >
                <Icon name="plus" size={22} />
                <span>Add captures</span>
              </button>
            </div>
          </aside>
          <section className="workspace" aria-label="Composition canvas">
            <div className="canvas-toolbar">
              <span className="canvas-size">
                Portrait <span>1080 × 1920</span>
              </span>
              <div className="history-actions">
                <button
                  className="icon-button"
                  aria-label="Undo"
                  title="Undo (⌘/Ctrl Z)"
                  disabled={!state.past.length || !!busy}
                  onClick={state.undo}
                >
                  <Icon name="undo" />
                </button>
                <button
                  className="icon-button"
                  aria-label="Redo"
                  title="Redo (⌘/Ctrl Shift Z)"
                  disabled={!state.future.length || !!busy}
                  onClick={state.redo}
                >
                  <Icon name="redo" />
                </button>
              </div>
            </div>
            <div className="canvas-surround">
              {shot ? (
                <>
                  <div className="canvas-label">
                    <span>
                      {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                      {String(project.shots.length).padStart(2, "0")}
                    </span>
                    <span>
                      {(shot.style.device ?? project.style.device) === "ios"
                        ? "iOS"
                        : "Android"}{" "}
                      frame
                    </span>
                  </div>
                  <div className="main-artboard">
                    <Preview
                      project={project}
                      shot={shot}
                      image={images.get(shot.assetId)}
                      onMove={
                        busy
                          ? undefined
                          : (x, y) =>
                              state.edit((project) => {
                                const target = project.shots.find(
                                  (item) => item.id === shot.id,
                                );
                                if (target) {
                                  target.phone.x = Math.max(
                                    -200,
                                    Math.min(900, x),
                                  );
                                  target.phone.y = Math.max(
                                    100,
                                    Math.min(1500, y),
                                  );
                                }
                              })
                      }
                    />
                  </div>
                  <div className="shot-actions">
                    <button
                      className="icon-button"
                      disabled={selectedIndex === 0 || !!busy}
                      aria-label="Move screenshot earlier"
                      onClick={() => reorder(-1)}
                    >
                      <Icon name="left" />
                    </button>
                    <button
                      className="button quiet"
                      disabled={!!busy || project.shots.length >= LIMITS.shots}
                      onClick={duplicate}
                    >
                      <Icon name="copy" />
                      Duplicate
                    </button>
                    <button
                      className="icon-button"
                      disabled={!!busy}
                      aria-label="Remove screenshot"
                      onClick={() => {
                        state.edit((project) => {
                          project.shots = project.shots.filter(
                            (item) => item.id !== shot.id,
                          );
                        });
                        setNotice({
                          message:
                            "Screenshot removed. Use Undo to bring it back.",
                        });
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                    <button
                      className="icon-button"
                      disabled={
                        selectedIndex === project.shots.length - 1 || !!busy
                      }
                      aria-label="Move screenshot later"
                      onClick={() => reorder(1)}
                    >
                      <Icon name="right" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-canvas">
                  <div className="empty-frames" aria-hidden="true">
                    <span />
                    <span>
                      <Icon name="image" size={38} />
                    </span>
                  </div>
                  <p className="eyebrow">LET'S FRAME YOUR FIRST IMPRESSION</p>
                  <h1>
                    Your app takes
                    <br />
                    center stage.
                  </h1>
                  <p>
                    Drop your screenshots here.
                    <br />
                    We'll give each one its own canvas.
                  </p>
                  <button
                    className="button primary"
                    disabled={!!busy}
                    onClick={() => chooseImages()}
                  >
                    <Icon name="plus" />
                    Choose screenshots
                  </button>
                  <small>PNG, JPG or WebP · Up to 20 MB each</small>
                </div>
              )}
            </div>
            <div className="workspace-footer">
              <span>{busy ?? "Made with a little care."}</span>
              <a
                href="https://hensell.dev"
                target="_blank"
                rel="noopener noreferrer"
              >
                hensell.dev <Icon name="arrow" size={13} />
              </a>
            </div>
          </section>
          {shot ? (
            <Inspector
              project={project}
              shot={shot}
              disabled={!!busy}
              onReplace={() => chooseImages(true)}
            />
          ) : (
            <aside className="inspector inspector-empty">
              <p className="eyebrow">FROM CAPTURE TO CANVAS</p>
              <h2>
                The details make
                <br />
                the difference.
              </h2>
              <ol>
                <li>
                  <span>01</span>
                  <div>
                    <strong>Bring your screenshots</strong>
                    <p>One screen or a whole series.</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Find your look</strong>
                    <p>iOS and Android frames, your colors, your words.</p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Ready for your launch</strong>
                    <p>Export a PNG or your entire series.</p>
                  </div>
                </li>
              </ol>
              <div className="privacy-note">
                <Icon name="folder" />
                <p>
                  Saved on this device.
                  <br />
                  Download a project file for a portable backup.
                </p>
              </div>
            </aside>
          )}
          {dragging && (
            <div className="drop-overlay">
              <Icon name="upload" size={38} />
              <strong>Drop to add your screenshots</strong>
            </div>
          )}
        </main>
      )}
      {busy && !exportOpen && (
        <div className="work-progress" role="status">
          <span className="spinner" />
          {busy}
        </div>
      )}
      {exportOpen && project && (
        <ExportDialog
          count={project.shots.length}
          busy={busy}
          file={readyFile}
          onClose={() => {
            if (!busy) setExportOpen(false);
          }}
          onExport={exportImages}
          onCancel={() => {
            cancelExport.current = true;
            setExportOpen(false);
          }}
        />
      )}
    </>
  );
}

function ExportDialog({
  count,
  busy,
  file,
  onClose,
  onExport,
  onCancel,
}: {
  count: number;
  busy: string | null;
  file: ReadyFile | null;
  onClose: () => void;
  onExport: (all: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="export-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (busy) onCancel();
        else onClose();
      }}
    >
      <div className="dialog-heading">
        <Icon name="download" size={26} />
        <button
          className="icon-button"
          aria-label="Close export"
          disabled={!!busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="eyebrow">READY FOR A FIRST IMPRESSION</p>
      <h2>
        {file ? (
          "Your export is ready."
        ) : (
          <>
            Take your work
            <br />
            out into the world.
          </>
        )}
      </h2>
      <p className="dialog-copy">
        Full-resolution PNGs. 1080 × 1920 pixels.
        <br />
        Exactly the composition you see on your canvas.
      </p>
      {busy ? (
        <div className="export-progress">
          <p role="status">
            <span className="spinner" />
            {busy}
          </p>
          <button className="button secondary full" onClick={onCancel}>
            Cancel export
          </button>
        </div>
      ) : file ? (
        <div className="export-result">
          {file.image && (
            <img
              className="export-preview"
              src={file.url}
              alt="Exported screenshot"
              width={1080}
              height={1920}
            />
          )}
          <a
            className="button primary full"
            href={file.url}
            download={file.name}
          >
            <Icon name="download" />
            Save {file.image ? "PNG" : "ZIP"}
          </a>
          <button className="button secondary full" onClick={onClose}>
            Back to editing
          </button>
        </div>
      ) : (
        <div className="export-options">
          <button
            className="button primary full"
            onClick={() => void onExport(false)}
          >
            <Icon name="image" />
            Export this screenshot<span>PNG</span>
          </button>
          <button
            className="button secondary full"
            onClick={() => void onExport(true)}
          >
            <Icon name="download" />
            Export all {count} screenshots<span>ZIP</span>
          </button>
        </div>
      )}
      <p className="field-help">
        Your source images and saved project stay editable.
      </p>
    </dialog>
  );
}
