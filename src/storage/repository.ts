import { referencedAssetIds } from "../core/localization";
import Dexie from "dexie";
import type { Table } from "dexie";
import { validateBrandKit, type BrandKit } from "../core/brand-kit";
import { migrateProject } from "../core/model";
import type {
  Asset,
  LegacyProject,
  LoadedProject,
  Project,
  V2Project,
  V3Project,
  V4Project,
  V5Project,
  V6Project,
  V7Project,
} from "../core/model";

interface ProjectRow {
  id: string;
  updatedAt: number;
  revision: number;
  project:
    | Project
    | V7Project
    | V6Project
    | V5Project
    | V4Project
    | V3Project
    | V2Project
    | LegacyProject;
}
interface AssetRow extends Asset {
  projectId: string;
}

/** The name input can autosave while empty; normalize only the stored copy. */
function storedProject(project: ProjectRow["project"]): Project {
  const document =
    project && typeof project.name === "string" && !project.name.trim()
      ? { ...project, name: "Untitled app" }
      : project;
  return migrateProject(document);
}

class ProjectDatabase extends Dexie {
  brandKits!: Table<BrandKit, string>;
  projects!: Table<ProjectRow, string>;
  assets!: Table<AssetRow, [string, string]>;
  constructor() {
    super("hen-screenshots");
    this.version(1).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    this.version(2).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    this.version(3).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
    this.version(4)
      .stores({
        projects: "id, updatedAt",
        assets: "[projectId+id], projectId",
      })
      .upgrade((transaction) =>
        transaction
          .table<ProjectRow, string>("projects")
          .toCollection()
          .modify((row) => {
            row.project = storedProject(row.project);
          }),
      );
    this.version(5)
      .stores({
        projects: "id, updatedAt",
        assets: "[projectId+id], projectId",
        brandKits: "id, updatedAt",
      })
      .upgrade((transaction) =>
        transaction
          .table<ProjectRow, string>("projects")
          .toCollection()
          .modify((row) => {
            row.project = storedProject(row.project);
          }),
      );
  }
}
const db = new ProjectDatabase();

export async function listBrandKits(): Promise<BrandKit[]> {
  const kits = await db.brandKits.orderBy("updatedAt").reverse().toArray();
  kits.forEach(validateBrandKit);
  return kits;
}

/** One revision wins, including when two browser tabs edit the same kit. */
export async function saveBrandKit(
  kit: BrandKit,
  expectedRevision: number,
): Promise<BrandKit> {
  validateBrandKit(kit);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    throw new Error("Invalid brand kit revision.");
  return db.transaction("rw", db.brandKits, async () => {
    const current = await db.brandKits.get(kit.id);
    if ((current?.revision ?? 0) !== expectedRevision)
      throw new Error(
        "This brand kit changed in another tab. Reopen it before saving.",
      );
    const saved = {
      ...structuredClone(kit),
      name: kit.name.trim(),
      revision: expectedRevision + 1,
      updatedAt: Date.now(),
    };
    await db.brandKits.put(saved);
    return saved;
  });
}

export async function deleteBrandKit(
  id: string,
  expectedRevision: number,
): Promise<void> {
  await db.transaction("rw", db.brandKits, async () => {
    const current = await db.brandKits.get(id);
    if (current && current.revision !== expectedRevision)
      throw new Error(
        "This brand kit changed in another tab. Reopen it before deleting.",
      );
    await db.brandKits.delete(id);
  });
}

export class ConflictError extends Error {
  constructor() {
    super("This project changed in another tab. Reopen it before saving.");
    this.name = "ConflictError";
  }
}

export async function listProjects(): Promise<
  { project: Project; revision: number }[]
> {
  return (await db.projects.orderBy("updatedAt").reverse().toArray()).map(
    ({ project, revision }) => ({ project: storedProject(project), revision }),
  );
}

export async function loadProject(id: string): Promise<LoadedProject> {
  return db.transaction("r", db.projects, db.assets, async () => {
    const row = await db.projects.get(id);
    if (!row)
      throw new Error(
        "Project not found. It may have been deleted in another tab.",
      );
    const assets = (
      await db.assets.where("projectId").equals(id).toArray()
    ).map(({ projectId: _owner, ...asset }) => asset);
    return {
      project: storedProject(row.project),
      revision: row.revision,
      assets,
    };
  });
}

/** Atomic and optimistic: all referenced images must exist before the document commits. */
export async function saveProject(
  project: Project,
  assets: Asset[],
  expectedRevision: number,
): Promise<number> {
  project = storedProject(project);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    throw new Error("Invalid project revision.");
  if (new Set(assets.map((asset) => asset.id)).size !== assets.length)
    throw new Error("Duplicate image IDs.");
  return db.transaction("rw", db.projects, db.assets, async () => {
    const current = await db.projects.get(project.id);
    if ((current?.revision ?? 0) !== expectedRevision)
      throw new ConflictError();
    if (current) storedProject(current.project);
    const referenced = referencedAssetIds(project);
    const storedKeys = await db.assets
      .where("projectId")
      .equals(project.id)
      .primaryKeys();
    const storedIds = new Set(storedKeys.map(([, id]) => id));
    const incoming = new Map(assets.map((asset) => [asset.id, asset]));
    const missing = referenced.filter((id) => !storedIds.has(id));
    if (missing.some((id) => !incoming.has(id)))
      throw new Error(
        "A screenshot image is missing. Re-import it before saving.",
      );
    // Asset IDs are immutable. Text edits write only the document, not all of
    // its blobs. Undo/redo retains its own source assets in the editor session.
    if (missing.length)
      await db.assets.bulkAdd(
        missing.map((id) => ({ ...incoming.get(id)!, projectId: project.id })),
      );
    const keep = new Set(referenced);
    await db.assets.bulkDelete(storedKeys.filter(([, id]) => !keep.has(id)));
    const revision = expectedRevision + 1;
    await db.projects.put({
      id: project.id,
      updatedAt: project.updatedAt,
      revision,
      project,
    });
    return revision;
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction("rw", db.projects, db.assets, async () => {
    await db.assets.where("projectId").equals(id).delete();
    await db.projects.delete(id);
  });
}
