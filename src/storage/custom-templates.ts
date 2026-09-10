import Dexie, { type Table } from "dexie";
import {
  validateTemplate,
  instantiateTemplate,
} from "../core/custom-templates";
import type { Asset, LoadedProject, Project } from "../core/model";
import { exportProject, importProject } from "./backup";

export interface CustomTemplate {
  id: string;
  name: string;
  createdAt: number;
  project: Project;
}
interface TemplateAsset extends Asset {
  templateId: string;
}
class TemplateDatabase extends Dexie {
  templates!: Table<CustomTemplate, string>;
  artwork!: Table<TemplateAsset, [string, string]>;
  constructor() {
    super("hen-screenshots-templates");
    this.version(1).stores({
      templates: "id, createdAt",
      artwork: "[templateId+id], templateId",
    });
  }
}
const db = new TemplateDatabase();
export const listCustomTemplates = () =>
  db.templates.orderBy("createdAt").reverse().toArray();
export async function loadCustomTemplate(id: string): Promise<LoadedProject> {
  return db.transaction("r", db.templates, db.artwork, async () => {
    const record = await db.templates.get(id);
    if (!record)
      throw new Error(
        "This template was removed. Refresh My templates and try again.",
      );
    const assets = (
      await db.artwork.where("templateId").equals(id).toArray()
    ).map(({ templateId: _id, ...asset }) => asset);
    const result = { project: record.project, assets, revision: 0 };
    validateTemplate(result);
    return result;
  });
}
export async function saveCustomTemplate(
  source: LoadedProject,
): Promise<CustomTemplate> {
  const copy = instantiateTemplate(source);
  const record = {
    id: copy.project.id,
    name: copy.project.name,
    createdAt: copy.project.createdAt,
    project: copy.project,
  };
  try {
    await db.transaction("rw", db.templates, db.artwork, async () => {
      await db.templates.add(record);
      await db.artwork.bulkAdd(
        copy.assets.map((asset) => ({ ...asset, templateId: record.id })),
      );
    });
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError")
      throw new Error(
        "Template storage is full. Export a backup and free some browser storage, then try again.",
      );
    throw error;
  }
  return record;
}
export async function deleteCustomTemplate(id: string) {
  await db.transaction("rw", db.templates, db.artwork, async () => {
    await db.artwork.where("templateId").equals(id).delete();
    await db.templates.delete(id);
  });
}
export async function exportCustomTemplate(id: string) {
  const source = await loadCustomTemplate(id);
  return exportProject(
    source.project,
    source.assets,
    "hen-screenshots-template",
  );
}
export async function importCustomTemplate(file: File) {
  const source = await importProject(
    file,
    undefined,
    "hen-screenshots-template",
  );
  validateTemplate(source);
  return saveCustomTemplate(source);
}
