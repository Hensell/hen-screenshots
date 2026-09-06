import { create } from "zustand";
import type { Asset, LoadedProject, Project } from "../core/model";
import { errorMessage } from "../core/model";
import { saveProject } from "../storage/repository";

type SaveStatus = "saved" | "pending" | "saving" | "error";
interface EditorState {
  project: Project | null;
  assets: Asset[];
  revision: number;
  selectedId: string | null;
  past: Project[];
  future: Project[];
  group: string | null;
  change: number;
  savedChange: number;
  status: SaveStatus;
  saveError: string | null;
  open: (loaded: LoadedProject) => void;
  close: () => void;
  select: (id: string) => void;
  edit: (recipe: (draft: Project) => void, group?: string) => void;
  addAssets: (assets: Asset[]) => void;
  endGroup: () => void;
  undo: () => void;
  redo: () => void;
  saveAsCopy: () => void;
}
const historyLimit = 60;
let editorSession = 0;
let saving: Promise<boolean> | undefined;
export const useEditor = create<EditorState>((set, get) => ({
  project: null,
  assets: [],
  revision: 0,
  selectedId: null,
  past: [],
  future: [],
  group: null,
  change: 0,
  savedChange: 0,
  status: "saved",
  saveError: null,
  open: ({ project, assets, revision }) => {
    editorSession++;
    set({
      project,
      assets,
      revision,
      selectedId: project.shots[0]?.id ?? null,
      past: [],
      future: [],
      group: null,
      change: 0,
      savedChange: revision === 0 ? -1 : 0,
      status: revision === 0 ? "pending" : "saved",
      saveError: null,
    });
  },
  close: () => {
    editorSession++;
    set({
      project: null,
      assets: [],
      past: [],
      future: [],
      selectedId: null,
      revision: 0,
      group: null,
      change: 0,
      savedChange: 0,
      status: "saved",
      saveError: null,
    });
  },
  select: (selectedId) => set({ selectedId, group: null }),
  edit: (recipe, group) => {
    const state = get();
    if (!state.project) return;
    const next = structuredClone(state.project);
    recipe(next);
    if (JSON.stringify(next) === JSON.stringify(state.project)) return;
    next.updatedAt = Date.now();
    set({
      project: next,
      past:
        group && state.group === group
          ? state.past
          : [...state.past, state.project].slice(-historyLimit),
      future: [],
      group: group ?? null,
      change: state.change + 1,
      status: state.status === "error" ? "error" : "pending",
      selectedId: next.shots.some((s) => s.id === state.selectedId)
        ? state.selectedId
        : (next.shots[0]?.id ?? null),
    });
  },
  addAssets: (assets) => set((s) => ({ assets: [...s.assets, ...assets] })),
  endGroup: () => set({ group: null }),
  undo: () => {
    const s = get(),
      previous = s.past.at(-1);
    if (!s.project || !previous) return;
    set({
      project: { ...previous, updatedAt: Date.now() },
      past: s.past.slice(0, -1),
      future: [s.project, ...s.future],
      group: null,
      change: s.change + 1,
      status: s.status === "error" ? "error" : "pending",
      selectedId: previous.shots.some((shot) => shot.id === s.selectedId)
        ? s.selectedId
        : (previous.shots[0]?.id ?? null),
    });
  },
  redo: () => {
    const s = get(),
      next = s.future[0];
    if (!s.project || !next) return;
    set({
      project: { ...next, updatedAt: Date.now() },
      past: [...s.past, s.project].slice(-historyLimit),
      future: s.future.slice(1),
      group: null,
      change: s.change + 1,
      status: s.status === "error" ? "error" : "pending",
      selectedId: next.shots.some((shot) => shot.id === s.selectedId)
        ? s.selectedId
        : (next.shots[0]?.id ?? null),
    });
  },
  saveAsCopy: () => {
    const s = get();
    if (!s.project || saving) return;
    editorSession++;
    const name = (s.project.name.trim() || "Untitled app").slice(0, 73);
    const now = Date.now();
    set({
      project: {
        ...s.project,
        id: crypto.randomUUID(),
        name: `${name} (copy)`,
        createdAt: now,
        updatedAt: now,
      },
      revision: 0,
      change: s.change + 1,
      savedChange: -1,
      status: "pending",
      saveError: null,
      past: [],
      future: [],
      group: null,
    });
  },
}));

// One writer per editor. Each transaction checks the persisted revision, including across tabs.
export function saveNow(): Promise<boolean> {
  if (saving) return saving;
  saving = (async () => {
    while (true) {
      const session = editorSession;
      const snapshot = useEditor.getState();
      if (!snapshot.project || snapshot.change === snapshot.savedChange)
        return true;
      useEditor.setState({ status: "saving", saveError: null });
      try {
        const revision = await saveProject(
          snapshot.project,
          snapshot.assets,
          snapshot.revision,
        );
        // Opening even the same project starts a new editing session. An old
        // result must not change its counters; keep draining the current session.
        if (editorSession !== session) continue;
        const latest = useEditor.getState();
        useEditor.setState({
          revision,
          savedChange: snapshot.change,
          status: latest.change === snapshot.change ? "saved" : "pending",
        });
      } catch (error) {
        if (editorSession !== session) continue;
        useEditor.setState({ status: "error", saveError: errorMessage(error) });
        return false;
      }
    }
  })().finally(() => {
    saving = undefined;
  });
  return saving;
}
