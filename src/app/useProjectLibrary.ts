import { useEffect, useState } from "react";
import {
  createProject,
  errorMessage,
  type LoadedProject,
  type Project,
} from "../core/model";
import { projectPurpose, type ProjectPurpose } from "../core/canvas-formats";
import { listProjects, loadProject } from "../storage/repository";
import { saveNow, useEditor } from "../editor/store";
import type { Notice } from "./types";

/** Own library loading and navigation; the editor still owns the active document. */
export function useProjectLibrary({
  projectId,
  busy,
  onBusy,
  onNotice,
  onOpen,
}: {
  projectId: string | undefined;
  busy: string | null;
  onBusy: (message: string | null) => void;
  onNotice: (notice: Notice | null) => void;
  onOpen: (loaded: LoadedProject) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryPurpose, setLibraryPurpose] =
    useState<ProjectPurpose>("stores");

  useEffect(() => {
    let active = true;
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) {
      setLoading(false);
      return;
    }
    loadProject(id)
      .then((loaded) => {
        if (active) onOpen(loaded);
      })
      .catch((error) => {
        if (active) onNotice({ message: errorMessage(error), error: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onOpen, onNotice]);

  useEffect(() => {
    if (projectId) return;
    let active = true;
    listProjects()
      .then((records) => {
        if (active) setProjects(records.map((record) => record.project));
      })
      .catch((error) => {
        if (active)
          onNotice({
            message: `Couldn't open local projects. ${errorMessage(error)}`,
            error: true,
          });
      });
    return () => {
      active = false;
    };
  }, [projectId, onNotice]);

  async function openExisting(id: string) {
    if (busy) return;
    onBusy("Opening project…");
    try {
      onOpen(await loadProject(id));
    } catch (error) {
      onNotice({ message: errorMessage(error), error: true });
    } finally {
      onBusy(null);
    }
  }
  async function backToProjects() {
    if (busy) return;
    onBusy("Saving project…");
    try {
      if (await saveNow()) {
        const editor = useEditor.getState();
        if (editor.project) setLibraryPurpose(projectPurpose(editor.project));
        editor.close();
        const url = new URL(window.location.href);
        url.searchParams.delete("project");
        window.history.replaceState(null, "", url);
        onNotice(null);
      }
    } finally {
      onBusy(null);
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
    onOpen({ project, assets: [], revision: 0 });
  }
  return {
    projects,
    loading,
    libraryPurpose,
    setLibraryPurpose,
    openExisting,
    backToProjects,
    newProject,
  };
}
