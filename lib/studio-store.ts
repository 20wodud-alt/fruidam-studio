import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoProduct, generateSections, type StudioProject } from "./studio";
import { storageProvider, supabaseStudioAccess } from "./supabase-storage";
const directory = path.join(process.cwd(), "data");
const file = path.join(directory, "studio.json");
const singleton = globalThis as typeof globalThis & { studioQueue?: Promise<unknown> };
export async function studioAccess(update?: (projects: StudioProject[]) => void): Promise<StudioProject[]> {
  const promise = (singleton.studioQueue ?? Promise.resolve()).then(async () => {
    if (storageProvider() === "supabase") return supabaseStudioAccess(update);
    let projects: StudioProject[];
    try { projects = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      projects = [{ id: randomUUID(), product: demoProduct, sections: generateSections(demoProduct), starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      await write(projects);
    }
    if (update) { update(projects); await write(projects); }
    return projects;
  });
  singleton.studioQueue = promise.catch(() => {});
  return promise;
}
async function write(projects: StudioProject[]) {
  await fs.mkdir(directory, { recursive: true });
  const temp = path.join(directory, `studio.${randomUUID()}.tmp`);
  await fs.writeFile(temp, JSON.stringify(projects, null, 2));
  await fs.rename(temp, file);
}
