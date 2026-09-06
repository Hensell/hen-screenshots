import Dexie from "dexie";
import type { Table } from "dexie";
import type { Asset, LoadedProject, Project } from "../core/model";

interface ProjectRow {
  id: string;
  updatedAt: number;
  revision: number;
  project: Project;
}
interface AssetRow extends Asset {
  projectId: string;
}

class ProjectDatabase extends Dexie {
  projects!: Table<ProjectRow, string>;
  assets!: Table<AssetRow, [string, string]>;
  constructor() {
    super("hen-screenshots");
    this.version(1).stores({
      projects: "id, updatedAt",
      assets: "[projectId+id], projectId",
    });
  }
}
const db = new ProjectDatabase();

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
    ({ project, revision }) => ({ project, revision }),
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
    return { project: row.project, revision: row.revision, assets };
  });
}

/** Atomic and optimistic: all referenced images must exist before the document commits. */
export async function saveProject(
  project: Project,
  assets: Asset[],
  expectedRevision: number,
): Promise<number> {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    throw new Error("Invalid project revision.");
  if (new Set(assets.map((asset) => asset.id)).size !== assets.length)
    throw new Error("Duplicate image IDs.");
  return db.transaction("rw", db.projects, db.assets, async () => {
    const current = await db.projects.get(project.id);
    if ((current?.revision ?? 0) !== expectedRevision)
      throw new ConflictError();
    if (assets.length)
      await db.assets.bulkPut(
        assets.map((asset) => ({ ...asset, projectId: project.id })),
      );
    const referenced = [...new Set(project.shots.map((shot) => shot.assetId))];
    const stored = await db.assets.bulkGet(
      referenced.map((id) => [project.id, id]),
    );
    if (stored.some((asset) => !asset))
      throw new Error(
        "A screenshot image is missing. Re-import it before saving.",
      );
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
