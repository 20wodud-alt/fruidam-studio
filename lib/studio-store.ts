import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { demoProduct, generateSections, type StudioProject } from "./studio";
import { storageProvider, supabaseStudioAccess } from "./supabase-storage";
import { currentMember } from "./commerce-auth";
import { CommerceError } from "./commerce-store";
const directory = path.join(process.cwd(), "data");
const file = path.join(directory, "studio.json");
const singleton = globalThis as typeof globalThis & { studioQueue?: Promise<unknown> };
export async function studioAccess(update?: (projects: StudioProject[]) => void): Promise<StudioProject[]> {
  const member = await currentMember();
  const allowed = member && member.role !== "admin" ? new Set(member.projects) : null;
  const scopedUpdate = !update ? undefined : (all: StudioProject[]) => {
    if (!allowed) { update(all); return; }
    const visible = all.filter(project => allowed.has(project.id));
    update(visible);
    if (visible.some(project => !allowed.has(project.id))) throw new CommerceError("공급상품에서 새 상세페이지를 시작해주세요.", 403);
    const ids = new Set(visible.map(project => project.id));
    for (let i=all.length-1;i>=0;i--) if (allowed.has(all[i].id) && !ids.has(all[i].id)) all.splice(i,1);
    for (const project of visible) { const index=all.findIndex(item=>item.id===project.id); if(index<0)all.unshift(project);else all[index]=project; }
  };
  const promise = (singleton.studioQueue ?? Promise.resolve()).then(async () => {
    if (storageProvider() === "supabase") { const projects=await supabaseStudioAccess(scopedUpdate); return allowed?projects.filter(project=>allowed.has(project.id)):projects; }
    let projects: StudioProject[];
    try { projects = JSON.parse(await fs.readFile(file, "utf8")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      projects = [{ id: randomUUID(), product: demoProduct, sections: generateSections(demoProduct), starred: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      await write(projects);
    }
    if (scopedUpdate) { scopedUpdate(projects); await write(projects); }
    return allowed?projects.filter(project=>allowed.has(project.id)):projects;
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
