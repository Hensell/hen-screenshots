import { isBannerProfile } from "../core/export-profiles";
import { companionFor } from "../core/device-composition";
import {
  editDevice,
  isDeviceElement,
  setDeviceImage,
} from "../core/device-composition";
import type { DeviceElement } from "../core/model";
import { useT } from "../i18n/react";
import { LanguageSelector } from "../i18n/LanguageSelector";
import { DeferredFeature } from "./DeferredFeature";
import { useProjectLibrary } from "./useProjectLibrary";
import { ProjectLibrary } from "./ProjectLibrary";
import type { Notice, ReadyFile } from "./types";
import {
  localizedProject,
  localContent,
  referencedAssetIds,
  languageName,
} from "../core/localization";
import "../editor/languages.css";
import { isPanoramaTemplate } from "../core/panorama-families";
import { moveText } from "../core/text-placement";
import {
  setDevicePlacement,
  type DevicePlacement,
} from "../core/device-placement";
import {
  lazy,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import mark from "../../brand/mark.svg";
import {
  createShot,
  errorMessage,
  LIMITS,
  PLACEMENT_LIMITS,
} from "../core/model";
import type { CanvasElement, LoadedProject, TextElement } from "../core/model";
import { importImages } from "../assets/import";
import { download, filename } from "../platform/download";
import { saveNow, useEditor } from "../editor/store";
import { useImages } from "../editor/useImages";
import { Preview } from "../editor/Preview";
import { Inspector, deviceNames, type InspectorTab } from "../editor/Inspector";
import { applyBrandKit } from "../core/brand-application";
import {
  applyTemplate,
  getTemplate,
  resetComposition,
} from "../core/templates";
import { CanvasSettings } from "../editor/CanvasSettings";
import { projectPurpose } from "../core/canvas-formats";
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
import { resolveExportProfile } from "../core/export-profiles";

const TemplateGallery = lazy(() =>
  import("../editor/TemplateGallery").then((module) => ({
    default: module.TemplateGallery,
  })),
);
const PublicationPreview = lazy(() =>
  import("../editor/PublicationPreview").then((module) => ({
    default: module.PublicationPreview,
  })),
);
const BrandKitDialog = lazy(() =>
  import("../editor/BrandKitDialog").then((module) => ({
    default: module.BrandKitDialog,
  })),
);
const ExportDialog = lazy(() =>
  import("./ExportDialog").then((module) => ({ default: module.ExportDialog })),
);
const LanguagesDialog = lazy(() =>
  import("../editor/LanguagesDialog").then((module) => ({
    default: module.LanguagesDialog,
  })),
);

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

export function App() {
  const t = useT();
  useEffect(() => {
    document.title = t("Your studio — Hen Screenshots");
  }, [t]);
  const state = useEditor();
  const {
    project: sourceProject,
    assets,
    selectedId,
    status,
    saveError,
    change,
  } = state;
  const locale =
    state.locale && sourceProject?.localization?.targets.includes(state.locale)
      ? state.locale
      : null;
  const project = useMemo(
    () => sourceProject && localizedProject(sourceProject, locale),
    [sourceProject, locale],
  );
  const banners = !!project && isBannerProfile(project.exportProfile);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [brandKitsOpen, setBrandKitsOpen] = useState(false);
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
      setInspectorTab(isDeviceElement(element) ? "device" : "text");
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
        if (target) {
          const locale =
            editor.locale && draft.localization?.targets.includes(editor.locale)
              ? editor.locale
              : null;
          if (locale) {
            const content = localContent(target, locale);
            // Explicit zero overrides are meaningful when the shared position is nonzero.
            const moved: typeof target = { ...target, textOffsets: {} };
            moveText(moved, element, x, y);
            content.textOffsets = {
              ...content.textOffsets,
              [element]: moved.textOffsets?.[element] ?? { x: 0, y: 0 },
            };
          } else moveText(target, element, x, y);
        }
      });
      if (editor.selectedId !== ownerId) editor.select(ownerId);
    },
    [],
  );
  const moveCanvasDevice = useCallback(
    (x: number, y: number, element: DeviceElement = "device") => {
      const editor = useEditor.getState();
      if (!editor.selectedId) return;
      editor.edit((draft) =>
        editLinkedShots(draft, editor.selectedId!, (shot) =>
          editDevice(shot, element, (target) => {
            target.phone.x = Math.max(
              PLACEMENT_LIMITS.x.min,
              Math.min(PLACEMENT_LIMITS.x.max, x),
            );
            target.phone.y = Math.max(
              PLACEMENT_LIMITS.y.min,
              Math.min(PLACEMENT_LIMITS.y.max, y),
            );
          }),
        ),
      );
    },
    [],
  );
  const resizeCanvasDevice = useCallback(
    (
      placement: DevicePlacement,
      ownerId: string,
      element: DeviceElement = "device",
    ) => {
      useEditor
        .getState()
        .edit((draft) =>
          editLinkedShots(draft, ownerId, (target) =>
            editDevice(target, element, (device) =>
              setDevicePlacement(device, placement),
            ),
          ),
        );
    },
    [],
  );
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
  const replaceElement = useRef<DeviceElement>("device");
  const replaceId = useRef<string | null>(null);
  const cancelExport = useRef<AbortController | null>(null);
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
  const projectId = project?.id;
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

  const {
    projects,
    loading,
    libraryPurpose,
    setLibraryPurpose,
    openExisting,
    backToProjects,
    newProject,
  } = useProjectLibrary({
    projectId,
    busy,
    onBusy: setBusy,
    onNotice: setNotice,
    onOpen: open,
  });

  useEffect(() => {
    if (!projectId || status !== "pending") return;
    const timer = setTimeout(() => {
      void saveNow();
    }, 450);
    return () => clearTimeout(timer);
  }, [projectId, change, status]);

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
        brandKitsOpen ||
        languagesOpen ||
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
    brandKitsOpen,
    languagesOpen,
    deleteTarget,
    slideMenu,
  ]);

  function chooseImages(
    replacementId?: string,
    element: DeviceElement = "device",
  ) {
    if (busy) return;
    const replacing = project?.shots.find((item) => item.id === replacementId);
    replaceElement.current =
      replacing && companionFor(replacing, element) ? element : "device";
    replaceId.current = replacementId ?? null;
    imageInput.current!.multiple = !replacementId;
    imageInput.current!.click();
  }
  async function addImages(files: File[]) {
    if (!project || busy || !files.length) return;
    const replacement = replaceId.current;
    const element = replaceElement.current;
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
      const beforeImport = structuredClone(sourceProject!);
      if (replacement)
        editLinkedShots(beforeImport, replacement, (target) => {
          setDeviceImage(target, element, "replacement-pending", locale);
        });
      const usedIds = new Set(referencedAssetIds(beforeImport));
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
            setDeviceImage(target, element, incoming[0].id, locale);
          });
          firstId = replacement;
        } else {
          incoming.forEach((asset) => {
            const next = createShot(asset.id, project.shots.length);
            if (isBannerProfile(project.exportProfile)) {
              next.title = "Your app, at a glance.";
              next.subtitle = "A little more to love, every day.";
            }
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
          : banners
            ? t(
                incoming.length === 1
                  ? "{count} banner added. Start with the headline."
                  : "{count} banners added. Start with the headline.",
                { count: incoming.length },
              )
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
      const { importProject } = await import("../storage/backup");
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
      const { exportProject } = await import("../storage/backup");
      offerFile(
        await exportProject(sourceProject!, assets),
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
  async function exportImages(all: boolean, languageCodes?: string[]) {
    if (!sourceProject || !shot || busy) return;
    const controller = new AbortController();
    cancelExport.current = controller;
    setBusy("Preparing export…");
    try {
      const { buildScreenshotExport } = await import("../export/screenshots");
      const result = await buildScreenshotExport({
        project: sourceProject,
        assets,
        images,
        shotId: shot.id,
        all,
        locale,
        languageCodes,
        signal: controller.signal,
        onProgress: setBusy,
      });
      offerFile(result.blob, result.name);
      setNotice({
        message: `${result.blob.type === "image/png" ? "Your PNG is" : "Your screenshots are"} ready. Check your downloads.`,
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setNotice({
          message: `Export couldn’t finish. ${errorMessage(error)}`,
          error: true,
        });
        setExportOpen(false);
      }
    } finally {
      cancelExport.current = null;
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
      publicationOpen ||
      brandKitsOpen ||
      languagesOpen
    )
      return;
    if (!point && slideMenu?.opener === opener) {
      closeSlideMenu();
      return;
    }
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
      <header className={`topbar ${project ? "editor-header" : ""}`}>
        {project ? (
          <button
            className="brand-home"
            aria-label={t("Back to projects")}
            title={t("Back to projects")}
            disabled={!!busy}
            onClick={() => void backToProjects()}
          >
            <Icon name="left" size={16} />
            <Brand />
          </button>
        ) : (
          <a href="/" aria-label={t("Hen Screenshots home")}>
            <Brand />
          </a>
        )}
        {project ? (
          <>
            <div className="editor-project">
              <label className="project-name-field" title={t("Rename project")}>
                <input
                  className="editor-project-name"
                  aria-label={t("Project name")}
                  title={t("Rename project")}
                  maxLength={80}
                  size={Math.max(12, Math.min(project.name.length + 2, 40))}
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
                <Icon name="edit" size={14} />
              </label>
              <span
                className={`editor-save-status ${status === "error" ? "has-error" : ""}`}
                role="status"
              >
                {status === "saved" && <Icon name="check" size={14} />}
                {t(savingText)}
              </span>
            </div>
            <div className="editor-file-actions">
              <LanguageSelector />
              <button
                className="button quiet project-download"
                aria-label={t("Download project file")}
                title={t("Download an editable .henscreenshots backup")}
                disabled={!!busy}
                onClick={() => void backup()}
              >
                <Icon name="folder" />
                <span className="download-label">{t("Download project")}</span>
                <span className="download-label-compact">
                  {t("Project file")}
                </span>
              </button>
              <button
                className="button secondary publication-button"
                aria-label={t("Publication preview")}
                disabled={!shot || !!busy || !!imageError}
                onClick={() => setPublicationOpen(true)}
              >
                <Icon name="eye" />
                {t("Preview")}
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
                {t("Export")}
              </button>
            </div>
          </>
        ) : (
          <>
            {" "}
            <span className="header-note">
              {t("Screenshot studio for apps")}
            </span>
            <LanguageSelector />{" "}
          </>
        )}
      </header>
      {notice && (
        <div
          className={`notice ${notice.error ? "notice-error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          <span>{t(notice.message)}</span>
          {readyFile && !notice.error && (
            <a
              className="text-button download-again"
              href={readyFile.url}
              download={readyFile.name}
            >
              {t("Save file")}
            </a>
          )}
          <button
            className="icon-button"
            aria-label={t("Dismiss message")}
            onClick={() => setNotice(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {saveError && project && (
        <div className="save-error" role="alert">
          <span>
            <strong>{t("Your changes are still here.")}</strong> {t(saveError)}
          </span>
          <div>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() => void saveNow()}
            >
              {t("Retry saving")}
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
              {t("Save as a copy")}
            </button>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() => void backup()}
            >
              {t("Download project")}
            </button>
          </div>
        </div>
      )}
      {imageError && project && (
        <div className="notice notice-error" role="alert">
          {t(
            "Couldn’t load an image. Replace the affected screenshot or reopen the project. Details: {error}",
            { error: t(imageError) },
          )}
        </div>
      )}
      {loading ? (
        <main className="loading-page" role="status">
          {t("Opening your studio…")}
        </main>
      ) : !project ? (
        <ProjectLibrary
          projects={projects}
          libraryPurpose={libraryPurpose}
          setLibraryPurpose={setLibraryPurpose}
          busy={busy}
          onNew={() => setNewProjectOpen(true)}
          onImport={() => backupInput.current!.click()}
          onBrandKits={() => setBrandKitsOpen(true)}
          onOpen={openExisting}
        />
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
          <div className="editor-toolbar" aria-label={t("Project tools")}>
            <div className="editing-actions">
              <div
                className="history-actions"
                role="group"
                aria-label={t("Edit history")}
              >
                <button
                  className="icon-button"
                  aria-label={t("Undo")}
                  ref={undoButton}
                  title={t("Undo (⌘/Ctrl Z)")}
                  disabled={!state.past.length || !!busy}
                  onClick={state.undo}
                >
                  <Icon name="undo" />
                </button>
                <button
                  className="icon-button"
                  aria-label={t("Redo")}
                  title={t("Redo (⌘/Ctrl Shift Z)")}
                  disabled={!state.future.length || !!busy}
                  onClick={state.redo}
                >
                  <Icon name="redo" />
                </button>
              </div>
              <div
                className="slide-tools"
                role="group"
                aria-label={t("Slide tools")}
              >
                <button
                  type="button"
                  className="toolbar-button templates-trigger"
                  disabled={!shot || !!busy || !images.get(shot.assetId)}
                  onClick={() => setTemplatesOpen(true)}
                >
                  <Icon name="layout" size={18} />
                  {t("Templates")}
                </button>
                <button
                  type="button"
                  className="toolbar-button desktop-slide-action"
                  disabled={!shot || !!busy}
                  onClick={() =>
                    shot &&
                    chooseImages(
                      shot.id,
                      selectedCanvasElement &&
                        isDeviceElement(selectedCanvasElement)
                        ? selectedCanvasElement
                        : "device",
                    )
                  }
                  title={
                    locale
                      ? t("Replace the {language} image and keep your design", {
                          language: languageName(locale),
                        })
                      : t("Replace the image and keep your design")
                  }
                >
                  <Icon name="image" size={18} />
                  {t("Replace image")}
                </button>
                <button
                  type="button"
                  className="toolbar-button desktop-slide-action"
                  disabled={
                    !shot ||
                    !!busy ||
                    project.shots.length + (pair ? 2 : 1) >
                      shotCapacity(project)
                  }
                  onClick={() => shot && duplicate(shot.id)}
                  aria-label={t(
                    pair ? "Duplicate panorama" : "Duplicate slide",
                  )}
                >
                  <Icon name="copy" size={18} />
                  {t("Duplicate")}
                </button>
                <button
                  type="button"
                  className="toolbar-button compact-slide-actions"
                  aria-label={t("Selected slide actions")}
                  aria-haspopup="menu"
                  aria-expanded={
                    !!slideMenu &&
                    slideMenu.opener.dataset.slideTools === "true"
                  }
                  aria-controls={slideMenu ? "slide-actions-menu" : undefined}
                  data-slide-tools="true"
                  disabled={!shot || !!busy}
                  onClick={(event) => {
                    if (shot) showSlideMenu(shot.id, event.currentTarget);
                  }}
                >
                  <Icon name="more" size={18} />
                  {t("Slide")}
                </button>
              </div>
            </div>
            <div
              className="project-context-tools"
              role="group"
              aria-label={t("Canvas and languages")}
            >
              <button
                type="button"
                className="canvas-format-button"
                onClick={() => openInspector("canvas")}
                disabled={!!busy || !shot}
                aria-label={t("Canvas settings: {name}, {width} × {height}", {
                  name: t(resolveExportProfile(project).name),
                  width: resolveExportProfile(project).width,
                  height: resolveExportProfile(project).height,
                })}
                title={t("Change canvas size and orientation for this project")}
              >
                <Icon name="canvas" size={17} />
                <span>
                  <small>
                    {t(
                      banners
                        ? "Banners"
                        : projectPurpose(project) === "stores"
                          ? "App stores"
                          : "Portfolio",
                    )}{" "}
                    {t("· Canvas")}
                  </small>
                  <strong>
                    {resolveExportProfile(project).width} ×{" "}
                    {resolveExportProfile(project).height}
                  </strong>
                </span>
                <Icon name="down" size={13} />
              </button>
              <div
                className={`language-control ${project.localization ? "has-versions" : ""}`}
              >
                {project.localization && (
                  <label className="language-switch">
                    <span>{t(locale ? "Text language" : "Original text")}</span>
                    <select
                      aria-label={t("Editing language")}
                      title={`${languageName(locale ?? project.localization.source)}${locale ? "" : ` · ${t("Original")}`}`}
                      value={locale ?? project.localization.source}
                      disabled={!!busy}
                      onChange={(event) => {
                        state.setLocale(
                          event.target.value === project.localization!.source
                            ? null
                            : event.target.value,
                        );
                        setReadyFile(null);
                      }}
                    >
                      <option value={project.localization.source}>
                        {languageName(project.localization.source)}
                      </option>
                      {project.localization.targets.map((code) => (
                        <option key={code} value={code}>
                          {languageName(code)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  className="language-manage"
                  disabled={!!busy || !shot}
                  onClick={() => setLanguagesOpen(true)}
                  aria-label={t("Manage languages")}
                  title={t("Add or manage language versions")}
                >
                  <Icon
                    name={project.localization ? "plus" : "languages"}
                    size={18}
                  />
                  <span>
                    {t(project.localization ? "Manage" : "Languages")}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <aside
            className="filmstrip"
            aria-label={t(banners ? "Banner designs" : "Screenshot series")}
            tabIndex={0}
          >
            <div className="filmstrip-heading">
              <h2>{t(banners ? "Banners" : "Slides")}</h2>
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
                    aria-label={t("Select screenshot {number}: {title}", {
                      number: index + 1,
                      title: item.title.replace(/\n/g, " "),
                    })}
                    aria-current={item.id === selectedId ? "true" : undefined}
                    disabled={!!busy}
                    onClick={() => state.select(item.id)}
                  >
                    <Preview
                      project={project}
                      shot={item}
                      images={images}
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
                      aria-label={t("Actions for slide {number}", {
                        number: index + 1,
                      })}
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
                <span>{t(banners ? "Add banner" : "Add captures")}</span>
              </button>
            </div>
          </aside>
          <section
            id="composition-canvas"
            className="workspace"
            aria-label={t("Composition canvas")}
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
                        ? t("Panorama · 2 linked slides")
                        : shot.companions
                          ? t("{count} devices", {
                              count: shot.companions.length + 1,
                            })
                          : banners
                            ? t("Image or icon")
                            : t("{device} frame", {
                                device: t(
                                  deviceNames[
                                    shot.style.device ?? project.style.device
                                  ],
                                ),
                              })}
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
                        images={images}
                        image={images.get(item.assetId)}
                        onContextMenu={(event) => contextMenu(event, item.id)}
                        guides={smartGuides}
                        onKeyDown={(event) => menuKeyboard(event, item.id)}
                        activeDevice={
                          selectedCanvasElement &&
                          isDeviceElement(selectedCanvasElement)
                            ? selectedCanvasElement
                            : null
                        }
                        onSelectElement={busy ? undefined : selectCanvasElement}
                        onTextMove={busy ? undefined : moveCanvasText}
                        onMove={busy ? undefined : moveCanvasDevice}
                        onResize={busy ? undefined : resizeCanvasDevice}
                      />
                    ))}
                  </div>
                  <p className="canvas-edit-help">
                    {t(
                      "Drag to move · Corners resize · Enter selects · Arrows move · + / − resize",
                    )}
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
                      {t("Smart guides")}
                    </label>
                    <span>
                      {smartGuides
                        ? t(
                            "Align edges, centers, and margins. Hold Alt/Option to move freely.",
                          )
                        : t("Move freely. Turn on guides for alignment.")}
                    </span>
                  </div>
                  {pair && (
                    <div
                      className="panorama-selection"
                      role="group"
                      aria-label={t("Edit panorama captions")}
                    >
                      {pair.map((item, index) => (
                        <button
                          key={item.id}
                          aria-pressed={item.id === shot.id}
                          disabled={!!busy}
                          onClick={() => state.select(item.id)}
                        >
                          {t(
                            index === 0
                              ? "Edit left slide"
                              : "Edit right slide",
                          )}{" "}
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
                      aria-label={t("Move screenshot earlier")}
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
                      {t(pair ? "Duplicate panorama" : "Duplicate")}
                    </button>
                    <button
                      className="icon-button"
                      disabled={!!busy}
                      aria-label={t(
                        pair ? "Remove panorama" : "Remove screenshot",
                      )}
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
                      aria-label={t("Move screenshot later")}
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
                  <p className="eyebrow">
                    {t("LET'S FRAME YOUR FIRST IMPRESSION")}
                  </p>
                  <h1>
                    {t("Your app takes")}
                    <br />
                    {t("center stage.")}
                  </h1>
                  <p>
                    {t(
                      banners
                        ? "Drop your image or icon here."
                        : "Drop your screenshots here.",
                    )}
                    <br />
                    {t("We'll give each one its own canvas.")}
                  </p>
                  <button
                    className="button primary"
                    disabled={!!busy}
                    onClick={() => chooseImages()}
                  >
                    <Icon name="plus" />
                    {t(banners ? "Upload image or icon" : "Choose screenshots")}
                  </button>
                  <small>{t("PNG, JPEG, or WebP · Up to 20 MB each")}</small>
                </div>
              )}
            </div>
            <div className="workspace-footer">
              <span>{t(busy ?? "Made with a little care.")}</span>
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
              onReplace={(element) =>
                chooseImages(
                  shot.id,
                  element ??
                    (selectedCanvasElement &&
                    isDeviceElement(selectedCanvasElement)
                      ? selectedCanvasElement
                      : "device"),
                )
              }
              onSelectDevice={(element) =>
                selectCanvasElement(element, shot.id)
              }
              onTemplates={() => setTemplatesOpen(true)}
              onBrandKits={() => setBrandKitsOpen(true)}
              onLanguages={() => setLanguagesOpen(true)}
              locale={locale}
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
              <section className="property-section">
                <button
                  className="button secondary"
                  disabled={!!busy}
                  onClick={() => setBrandKitsOpen(true)}
                >
                  <Icon name="brand" />
                  {t("Brand kits")}
                </button>
              </section>
              <fieldset disabled={!!busy} className="inspector-fields">
                <CanvasSettings project={project} />
              </fieldset>
              <div className="privacy-note">
                <Icon name="folder" />
                <p>
                  {t("Saved on this device.")}
                  <br />
                  {t("Download a project file for a portable backup.")}
                </p>
              </div>
            </aside>
          )}
          {dragging && (
            <div className="drop-overlay">
              <Icon name="upload" size={38} />
              <strong>{t("Drop to add your screenshots")}</strong>
            </div>
          )}
        </main>
      )}
      {busy && !exportOpen && (
        <div className="work-progress" role="status">
          <span className="spinner" />
          {t(busy)}
        </div>
      )}
      {exportOpen && project && (
        <DeferredFeature label="Export" onClose={() => setExportOpen(false)}>
          <ExportDialog
            count={project.shots.length}
            languages={
              sourceProject?.localization
                ? [
                    sourceProject.localization.source,
                    ...sourceProject.localization.targets,
                  ]
                : []
            }
            currentLanguage={
              locale ?? sourceProject?.localization?.source ?? ""
            }
            pair={!!pair}
            profile={resolveExportProfile(project)}
            busy={busy}
            file={readyFile}
            onClose={() => {
              if (!busy) setExportOpen(false);
            }}
            onExport={exportImages}
            onCancel={() => {
              cancelExport.current?.abort();
              setExportOpen(false);
            }}
          />
        </DeferredFeature>
      )}
      {newProjectOpen && (
        <NewProjectDialog
          onCreate={(purpose) => {
            newProject(purpose);
            setNewProjectOpen(false);
          }}
          onClose={() => setNewProjectOpen(false)}
        />
      )}
      {publicationOpen && project && shot && (
        <DeferredFeature
          label="Publication preview"
          onClose={() => setPublicationOpen(false)}
        >
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
        </DeferredFeature>
      )}
      {languagesOpen && sourceProject && (
        <DeferredFeature
          label="Languages"
          onClose={() => setLanguagesOpen(false)}
        >
          <LanguagesDialog
            project={sourceProject}
            locale={locale}
            onClose={() => {
              state.endGroup();
              setLanguagesOpen(false);
            }}
            onLocale={state.setLocale}
            onEdit={state.edit}
            onSelect={state.select}
          />
        </DeferredFeature>
      )}
      {brandKitsOpen && (
        <DeferredFeature
          label="Brand kits"
          onClose={() => setBrandKitsOpen(false)}
        >
          <BrandKitDialog
            project={project}
            shot={shot}
            images={images}
            onClose={() => setBrandKitsOpen(false)}
            onApply={(kit, all) => {
              state.edit((draft) =>
                applyBrandKit(draft, kit, selectedId ?? undefined, all),
              );
              setBrandKitsOpen(false);
              setNotice({
                message: `${kit.name} applied to ${all ? "the project" : pair ? "both linked slides" : "this slide"}. Undo anytime.`,
              });
            }}
          />
        </DeferredFeature>
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
            label={t(
              menuShots.length === 2 ? "Slides {numbers}" : "Slide {numbers}",
              {
                numbers: menuShots
                  .map((item) =>
                    String(project.shots.indexOf(item) + 1).padStart(2, "0"),
                  )
                  .join("–"),
              },
            )}
            panorama={menuShots.length === 2}
            canDuplicate={
              project.shots.length + menuShots.length <= shotCapacity(project)
            }
            capacity={shotCapacity(project)}
            onClose={closeSlideMenu}
            onEdit={() => {
              state.select(slideMenu.shotId);
              openInspector(inspectorTab);
            }}
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
        <DeferredFeature
          label="Templates"
          onClose={() => setTemplatesOpen(false)}
        >
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
        </DeferredFeature>
      )}
    </>
  );
}
