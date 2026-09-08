import { isPanoramaTemplate } from "../core/panorama-families";
import { moveText } from "../core/text-placement";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { zip } from "fflate";
import mark from "../../brand/mark.svg";
import {
  createProject,
  createShot,
  errorMessage,
  LIMITS,
  PLACEMENT_LIMITS,
} from "../core/model";
import type {
  CanvasElement,
  LoadedProject,
  Project,
  TextElement,
} from "../core/model";
import { importImages, loadImage } from "../assets/import";
import { listProjects, loadProject } from "../storage/repository";
import { exportProject, importProject } from "../storage/backup";
import { renderShot } from "../export/images";
import { download, filename } from "../platform/download";
import { saveNow, useEditor } from "../editor/store";
import { useImages } from "../editor/useImages";
import { Preview } from "../editor/Preview";
import { Inspector, deviceNames, type InspectorTab } from "../editor/Inspector";
import { TemplateGallery } from "../editor/TemplateGallery";
import { PublicationPreview } from "../editor/PublicationPreview";
import {
  applyTemplate,
  getTemplate,
  resetComposition,
} from "../core/templates";
import { CanvasSettings } from "../editor/CanvasSettings";
import { projectPurpose, type ProjectPurpose } from "../core/canvas-formats";
import { NewProjectDialog } from "./NewProjectDialog";
import { DeleteSlidesDialog } from "./DeleteSlidesDialog";
import { SlideActionsMenu, type SlideMenuTarget } from "./SlideActionsMenu";
import {
  duplicateUnit,
  editLinkedShots,
  linkedShots,
  moveUnit,
  panoramaPair,
  removeUnit,
  shotCapacity,
} from "../core/panorama";
import { Icon } from "./Icon";
import {
  resolveExportProfile,
  exportProfileSuffix,
  type ExportProfile,
} from "../core/export-profiles";

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
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [libraryPurpose, setLibraryPurpose] =
    useState<ProjectPurpose>("stores");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [smartGuides, setSmartGuides] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("design");
  const [selectedCanvasElement, setSelectedCanvasElement] =
    useState<CanvasElement | null>(null);
  function openInspector(tab: InspectorTab) {
    setInspectorTab(tab);
    requestAnimationFrame(() => {
      const inspector = document.getElementById("slide-inspector");
      inspector
        ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
        ?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 800px)").matches)
        inspector?.scrollIntoView({ block: "start" });
    });
  }
  // Stable callbacks keep opening an inspector tab from interrupting a canvas drag.
  const selectCanvasElement = useCallback(
    (element: CanvasElement, ownerId: string) => {
      setSelectedCanvasElement(element);
      setInspectorTab(element === "device" ? "device" : "text");
      const editor = useEditor.getState();
      if (editor.selectedId !== ownerId) editor.select(ownerId);
    },
    [],
  );
  const moveCanvasText = useCallback(
    (element: TextElement, x: number, y: number, ownerId: string) => {
      const editor = useEditor.getState();
      editor.edit((draft) => {
        const target = draft.shots.find(
          (candidate) => candidate.id === ownerId,
        );
        if (target) moveText(target, element, x, y);
      });
      if (editor.selectedId !== ownerId) editor.select(ownerId);
    },
    [],
  );
  const moveCanvasDevice = useCallback((x: number, y: number) => {
    const editor = useEditor.getState();
    if (!editor.selectedId) return;
    editor.edit((draft) =>
      editLinkedShots(draft, editor.selectedId!, (target) => {
        target.phone.x = Math.max(
          PLACEMENT_LIMITS.x.min,
          Math.min(PLACEMENT_LIMITS.x.max, x),
        );
        target.phone.y = Math.max(
          PLACEMENT_LIMITS.y.min,
          Math.min(PLACEMENT_LIMITS.y.max, y),
        );
      }),
    );
  }, []);
  const [slideMenu, setSlideMenu] = useState<SlideMenuTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    projectId: string;
    shotId: string;
  } | null>(null);
  const [readyFile, setReadyFile] = useState<ReadyFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const undoButton = useRef<HTMLButtonElement>(null);
  const replaceId = useRef<string | null>(null);
  const cancelExport = useRef(false);
  const dragCount = useRef(0);
  const { images, error: imageError } = useImages(assets, project?.shots);
  const shot = project?.shots.find((shot) => shot.id === selectedId);

  const pair = project && shot ? panoramaPair(project, shot.id) : null;
  const deletingShots =
    project && deleteTarget?.projectId === project.id
      ? linkedShots(project, deleteTarget.shotId)
      : [];
  const menuShots =
    project && slideMenu?.projectId === project.id
      ? linkedShots(project, slideMenu.shotId)
      : [];
  const closeSlideMenu = useCallback(
    (restoreFocus = true) => {
      if (restoreFocus && slideMenu?.opener.isConnected)
        slideMenu.opener.focus({ preventScroll: true });
      setSlideMenu(null);
    },
    [slideMenu],
  );
  const visibleProjects = projects.filter(
    (item) => projectPurpose(item) === libraryPurpose,
  );
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
    setInspectorTab("design");
    setSelectedCanvasElement(null);
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
      if (
        !useEditor.getState().project ||
        busy ||
        exportOpen ||
        templatesOpen ||
        publicationOpen ||
        deleteTarget ||
        slideMenu
      )
        return;
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
  }, [
    busy,
    exportOpen,
    templatesOpen,
    publicationOpen,
    deleteTarget,
    slideMenu,
  ]);

  async function backToProjects() {
    if (busy) return;
    setBusy("Saving project…");
    if (await saveNow()) {
      if (project) setLibraryPurpose(projectPurpose(project));
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
  function newProject(purpose: ProjectPurpose) {
    const project = createProject(
      purpose === "portfolio" ? "Untitled portfolio" : "Untitled app",
    );
    if (purpose === "portfolio") {
      project.exportProfile = "portfolio-card";
      project.style.device = "card";
      project.style.deviceOrientation = "landscape";
      project.style.template = "studio";
    }
    setLibraryPurpose(purpose);
    setNewProjectOpen(false);
    open({ project, assets: [], revision: 0 });
  }
  function chooseImages(replacementId?: string) {
    if (busy) return;
    replaceId.current = replacementId ?? null;
    imageInput.current!.multiple = !replacementId;
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
      const replacedIds = new Set(
        replacement
          ? linkedShots(project, replacement).map((shot) => shot.id)
          : [],
      );
      const usedIds = new Set(
        project.shots
          .filter((s) => !replacedIds.has(s.id))
          .map((s) => s.assetId),
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
          editLinkedShots(project, replacement, (target) => {
            target.assetId = incoming[0].id;
          });
          firstId = replacement;
        } else {
          incoming.forEach((asset) => {
            const next = createShot(asset.id, project.shots.length);
            resetComposition(project, next);
            firstId ??= next.id;
            project.shots.push(next);
          });
        }
      });
      if (firstId) state.select(firstId);
      setNotice({
        message: replacement
          ? `${replacedIds.size === 2 ? "Panorama image" : "Image"} replaced. Your layout is preserved. Undo anytime.`
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
    const shots = all ? snapshot.shots : linkedShots(snapshot, shot.id);
    const multiple = all || shots.length > 1;
    cancelExport.current = false;
    setBusy("Preparing export…");
    try {
      const profile = resolveExportProfile(snapshot);
      if (all && shots.length > profile.maxCount)
        throw new Error(
          `This destination accepts at most ${profile.maxCount} screenshots per device slot. Export individual screenshots or reduce the series.`,
        );
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
      if (multiple) {
        setBusy("Packaging screenshots…");
        const archive = await new Promise<Uint8Array>((resolve, reject) =>
          zip(files, { level: 0 }, (error, result) =>
            error ? reject(error) : resolve(result),
          ),
        );
        if (cancelExport.current) return;
        offerFile(
          new Blob([new Uint8Array(archive)], { type: "application/zip" }),
          `${filename(snapshot.name)}-${exportProfileSuffix(snapshot)}${!all ? "-panorama" : ""}.zip`,
        );
      } else if (png)
        offerFile(
          png,
          `${filename(snapshot.name)}-${exportProfileSuffix(snapshot)}-${String(project.shots.findIndex((s) => s.id === shot.id) + 1).padStart(2, "0")}.png`,
        );
      setNotice({
        message: `${multiple ? "Your screenshots are" : "Your PNG is"} ready. Check your downloads.`,
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
  function showSlideMenu(
    shotId: string,
    opener: HTMLElement,
    point?: { x: number; y: number },
  ) {
    if (
      !project ||
      busy ||
      deleteTarget ||
      templatesOpen ||
      exportOpen ||
      publicationOpen
    )
      return;
    const bounds = opener.getBoundingClientRect();
    setSlideMenu({
      projectId: project.id,
      shotId,
      opener,
      x: point?.x ?? bounds.left,
      y: point?.y ?? bounds.bottom + 4,
    });
  }
  function contextMenu(event: MouseEvent<HTMLElement>, shotId: string) {
    event.preventDefault();
    const opener =
      event.currentTarget.querySelector<HTMLElement>(
        '.shot-options, [tabindex="0"]',
      ) ?? event.currentTarget;
    showSlideMenu(shotId, opener, { x: event.clientX, y: event.clientY });
  }
  function menuKeyboard(
    event: ReactKeyboardEvent<HTMLElement>,
    shotId: string,
  ) {
    if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10"))
      return;
    event.preventDefault();
    showSlideMenu(shotId, event.target as HTMLElement);
  }
  function duplicate(shotId: string) {
    if (!project || busy) return;
    let id: string | undefined;
    state.edit((project) => {
      id = duplicateUnit(project, shotId);
    });
    if (id) state.select(id);
  }
  function reorder(direction: number) {
    if (!shot) return;
    state.edit((project) => moveUnit(project, shot.id, direction));
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
          <a href="/" aria-label="Hen Screenshots home">
            <Brand />
          </a>
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
                className="button secondary publication-button"
                aria-label="Publication preview"
                disabled={!shot || !!busy || !!imageError}
                onClick={() => setPublicationOpen(true)}
              >
                <Icon name="eye" /> Preview
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
                onClick={() => setNewProjectOpen(true)}
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
              <span className="muted">
                {visibleProjects.length} in this workspace
              </span>
            </div>
            <div
              className="library-purpose"
              role="group"
              aria-label="Project workspace"
            >
              {(["stores", "portfolio"] as const).map((purpose) => (
                <button
                  key={purpose}
                  aria-pressed={libraryPurpose === purpose}
                  onClick={() => setLibraryPurpose(purpose)}
                >
                  {purpose === "stores" ? "App stores" : "Portfolio"}
                  <span>
                    {
                      projects.filter(
                        (item) => projectPurpose(item) === purpose,
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            {visibleProjects.length ? (
              <div className="project-grid">
                {visibleProjects.map((item) => (
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
                  <h3>
                    {libraryPurpose === "stores"
                      ? "A place for your next launch."
                      : "A place for your best work."}
                  </h3>
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
          <div className="studio-toolbar" aria-label="Project tools">
            <div className="toolbar-group">
              <button
                type="button"
                className="toolbar-button"
                disabled={!shot || !!busy || !images.get(shot.assetId)}
                onClick={() => setTemplatesOpen(true)}
              >
                <Icon name="layout" size={18} /> Templates
              </button>
              <button
                type="button"
                className="toolbar-button"
                disabled={!shot || !!busy}
                onClick={() => shot && chooseImages(shot.id)}
                title="Replace the image and keep your design"
              >
                <Icon name="image" size={18} /> Replace image
              </button>
              <button
                type="button"
                className="toolbar-button toolbar-duplicate"
                disabled={
                  !shot ||
                  !!busy ||
                  project.shots.length + (pair ? 2 : 1) > shotCapacity(project)
                }
                onClick={() => shot && duplicate(shot.id)}
                aria-label={pair ? "Duplicate panorama" : "Duplicate slide"}
              >
                <Icon name="copy" size={18} /> Duplicate
              </button>
            </div>
            <button
              type="button"
              className="canvas-format-button"
              onClick={() => openInspector("canvas")}
              disabled={!!busy || !shot}
            >
              <Icon name="canvas" size={16} />
              <span>
                {projectPurpose(project) === "stores"
                  ? "App stores"
                  : "Portfolio"}
                <strong>
                  {resolveExportProfile(project).width} ×{" "}
                  {resolveExportProfile(project).height}
                </strong>
              </span>
              <Icon name="down" size={13} />
            </button>
            <div
              className="history-actions"
              role="group"
              aria-label="Edit history"
            >
              <button
                className="icon-button"
                aria-label="Undo"
                ref={undoButton}
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
            {shot && (
              <button
                type="button"
                className="toolbar-button mobile-edit-link"
                onClick={() => openInspector(inspectorTab)}
              >
                <Icon name="text" size={17} /> Edit slide
              </button>
            )}
          </div>
          <aside
            className="filmstrip"
            aria-label="Screenshot series"
            tabIndex={0}
          >
            <div className="filmstrip-heading">
              <h2>Slides</h2>
              <span>
                {project.shots.length}/{LIMITS.shots}
              </span>
            </div>
            <div className="shot-list">
              {project.shots.map((item, index) => (
                <div
                  className={`shot-item ${item.id === selectedId ? "selected" : ""}`}
                  key={item.id}
                  onContextMenu={(event) => contextMenu(event, item.id)}
                  onKeyDown={(event) => menuKeyboard(event, item.id)}
                >
                  <button
                    className="shot-thumbnail"
                    aria-label={`Select screenshot ${index + 1}: ${item.title.replace(/\n/g, " ")}`}
                    aria-current={item.id === selectedId ? "true" : undefined}
                    disabled={!!busy}
                    onClick={() => state.select(item.id)}
                  >
                    <Preview
                      project={project}
                      shot={item}
                      image={images.get(item.assetId)}
                      small
                    />
                  </button>
                  <div className="shot-item-meta">
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <button
                      className="shot-options icon-button"
                      aria-label={`Actions for slide ${index + 1}`}
                      aria-haspopup="menu"
                      aria-expanded={slideMenu?.shotId === item.id}
                      aria-controls={
                        slideMenu?.shotId === item.id
                          ? "slide-actions-menu"
                          : undefined
                      }
                      disabled={!!busy}
                      onClick={(event) =>
                        showSlideMenu(item.id, event.currentTarget)
                      }
                    >
                      <Icon name="more" />
                    </button>
                  </div>
                </div>
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
          <section
            id="composition-canvas"
            className="workspace"
            aria-label="Composition canvas"
            tabIndex={0}
          >
            <div
              className="canvas-surround"
              style={
                {
                  "--preview-chrome": pair ? "440px" : "385px",
                  "--canvas-ratio":
                    ((pair ? 2 : 1) * resolveExportProfile(project).width) /
                    resolveExportProfile(project).height,
                  "--preview-max":
                    pair ||
                    resolveExportProfile(project).width >
                      resolveExportProfile(project).height
                      ? "900px"
                      : "470px",
                } as React.CSSProperties
              }
            >
              {shot ? (
                <>
                  <div className="canvas-label">
                    <span>
                      {pair
                        ? `${String(project.shots.indexOf(pair[0]) + 1).padStart(2, "0")}–${String(project.shots.indexOf(pair[1]) + 1).padStart(2, "0")}`
                        : String(selectedIndex + 1).padStart(2, "0")}{" "}
                      / {String(project.shots.length).padStart(2, "0")}
                    </span>
                    <span>
                      {pair
                        ? "Panorama · 2 linked slides"
                        : `${deviceNames[shot.style.device ?? project.style.device]} frame`}
                    </span>
                  </div>
                  <div
                    className={`main-artboard ${pair ? "panorama-board" : ""}`}
                  >
                    {(pair ?? [shot]).map((item) => (
                      <Preview
                        key={item.id}
                        project={project}
                        shot={item}
                        image={images.get(item.assetId)}
                        onContextMenu={(event) => contextMenu(event, item.id)}
                        guides={smartGuides}
                        onKeyDown={(event) => menuKeyboard(event, item.id)}
                        onSelectElement={busy ? undefined : selectCanvasElement}
                        onTextMove={busy ? undefined : moveCanvasText}
                        onMove={busy ? undefined : moveCanvasDevice}
                      />
                    ))}
                  </div>
                  <p className="canvas-edit-help">
                    Click an object to edit it. Drag to move. Enter selects ·
                    Arrow keys nudge.
                  </p>
                  <div className="canvas-guide-tools">
                    <label>
                      <input
                        type="checkbox"
                        checked={smartGuides}
                        disabled={!!busy}
                        onChange={(event) =>
                          setSmartGuides(event.target.checked)
                        }
                      />
                      Smart guides
                    </label>
                    <span>
                      {smartGuides
                        ? "Align edges, centers and margins. Alt/Option moves freely."
                        : "Move freely. Turn on guides for alignment."}
                    </span>
                  </div>
                  {pair && (
                    <div
                      className="panorama-selection"
                      role="group"
                      aria-label="Edit panorama captions"
                    >
                      {pair.map((item, index) => (
                        <button
                          key={item.id}
                          aria-pressed={item.id === shot.id}
                          disabled={!!busy}
                          onClick={() => state.select(item.id)}
                        >
                          Edit {index === 0 ? "left" : "right"} slide{" "}
                          <span>
                            {String(project.shots.indexOf(item) + 1).padStart(
                              2,
                              "0",
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="shot-actions">
                    <button
                      className="icon-button"
                      disabled={
                        (pair
                          ? project.shots.indexOf(pair[0])
                          : selectedIndex) === 0 || !!busy
                      }
                      aria-label="Move screenshot earlier"
                      onClick={() => reorder(-1)}
                    >
                      <Icon name="left" />
                    </button>
                    <button
                      className="button quiet"
                      disabled={
                        !!busy ||
                        project.shots.length + (pair ? 2 : 1) >
                          shotCapacity(project)
                      }
                      onClick={() => duplicate(shot.id)}
                    >
                      <Icon name="copy" />
                      {pair ? "Duplicate panorama" : "Duplicate"}
                    </button>
                    <button
                      className="icon-button"
                      disabled={!!busy}
                      aria-label={
                        pair ? "Remove panorama" : "Remove screenshot"
                      }
                      onClick={() => {
                        setDeleteTarget({
                          projectId: project.id,
                          shotId: shot.id,
                        });
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                    <button
                      className="icon-button"
                      disabled={
                        (pair
                          ? project.shots.indexOf(pair[1])
                          : selectedIndex) ===
                          project.shots.length - 1 || !!busy
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
              onReplace={() => chooseImages(shot.id)}
              onTemplates={() => setTemplatesOpen(true)}
              tab={inspectorTab}
              onTabChange={(tab) => {
                state.endGroup();
                setInspectorTab(tab);
              }}
              selectedElement={selectedCanvasElement}
              onPreview={() => {
                const workspace = document.getElementById("composition-canvas");
                workspace?.scrollIntoView({ block: "start" });
                workspace?.focus({ preventScroll: true });
              }}
            />
          ) : (
            <aside className="inspector inspector-empty">
              <fieldset disabled={!!busy} className="inspector-fields">
                <CanvasSettings project={project} />
              </fieldset>
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
          pair={!!pair}
          profile={resolveExportProfile(project)}
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
      {newProjectOpen && (
        <NewProjectDialog
          onCreate={newProject}
          onClose={() => setNewProjectOpen(false)}
        />
      )}
      {publicationOpen && project && shot && (
        <PublicationPreview
          project={project}
          images={images}
          selectedId={selectedId}
          onClose={() => setPublicationOpen(false)}
          onEdit={(id) => {
            state.select(id);
            setSelectedCanvasElement(null);
            setPublicationOpen(false);
          }}
        />
      )}
      {slideMenu &&
        project &&
        menuShots.length > 0 &&
        !busy &&
        !deleteTarget &&
        !templatesOpen &&
        !exportOpen && (
          <SlideActionsMenu
            target={slideMenu}
            label={`${menuShots.length === 2 ? "Slides" : "Slide"} ${menuShots.map((item) => String(project.shots.indexOf(item) + 1).padStart(2, "0")).join("–")}`}
            panorama={menuShots.length === 2}
            canDuplicate={
              project.shots.length + menuShots.length <= shotCapacity(project)
            }
            capacity={shotCapacity(project)}
            onClose={closeSlideMenu}
            onReplace={() => chooseImages(slideMenu.shotId)}
            onDuplicate={() => duplicate(slideMenu.shotId)}
            onDelete={() =>
              setDeleteTarget({
                projectId: project.id,
                shotId: slideMenu.shotId,
              })
            }
          />
        )}
      {deleteTarget && project && deletingShots.length > 0 && (
        <DeleteSlidesDialog
          slides={deletingShots.map((item) => ({
            number: project.shots.indexOf(item) + 1,
            title: item.title,
          }))}
          fallbackFocus={undoButton}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            state.edit((draft) => {
              if (draft.id === deleteTarget.projectId)
                removeUnit(draft, deleteTarget.shotId);
            });
            setDeleteTarget(null);
            setNotice({
              message: `${deletingShots.length === 2 ? "Panorama" : "Screenshot"} removed. Use Undo to bring it back.`,
            });
          }}
        />
      )}
      {templatesOpen && project && shot && (
        <TemplateGallery
          project={project}
          shot={shot}
          images={images}
          onClose={() => setTemplatesOpen(false)}
          onApply={(id, all, keepColors) => {
            state.edit((draft) =>
              applyTemplate(draft, shot.id, id, all, keepColors),
            );
            setTemplatesOpen(false);
            setReadyFile(null);
            setNotice({
              message: isPanoramaTemplate(id)
                ? "Panorama ready. Edit each caption and export the two slides together."
                : `${getTemplate(id).name} applied to ${all ? `all ${project.shots.length} screenshots` : pair ? "both slides" : "this screenshot"}. You can undo this change.`,
            });
          }}
        />
      )}
    </>
  );
}

function ExportDialog({
  count,
  pair,
  profile,
  busy,
  file,
  onClose,
  onExport,
  onCancel,
}: {
  count: number;
  pair: boolean;
  profile: ExportProfile;
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
      aria-labelledby="export-heading"
      aria-describedby="export-description"
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
      <h2 id="export-heading">
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
      <p className="dialog-copy" id="export-description">
        {profile.width} × {profile.height} pixels · RGB PNG without
        transparency.
        <br />
        {profile.name}
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
              width={profile.width}
              height={profile.height}
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
            {pair ? "Export this panorama" : "Export this screenshot"}
            <span>{pair ? "ZIP · 2 PNGs" : "PNG"}</span>
          </button>
          <button
            className="button secondary full"
            disabled={count > profile.maxCount}
            onClick={() => void onExport(true)}
          >
            <Icon name="download" />
            Export all {count} screenshots<span>ZIP</span>
          </button>
        </div>
      )}
      {!file && (
        <p className="field-help export-guidance">
          {profile.note}{" "}
          {count > profile.maxCount && (
            <strong>
              This series has {count} screenshots; the selected destination
              allows {profile.maxCount}. Export one at a time or reduce the
              series.
            </strong>
          )}
          {profile.source && (
            <>
              {" "}
              <a
                href={profile.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                View store requirements ↗
              </a>
            </>
          )}
        </p>
      )}
      <p className="field-help">
        Your source images and saved project stay editable.
      </p>
    </dialog>
  );
}
