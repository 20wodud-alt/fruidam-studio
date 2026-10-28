import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { configuration, managementRequest, rpc } from "./supabase-helpers.mjs";

try {
  const config = configuration();
  const target = await managementRequest(config.ref, "");
  if (target.name !== "FRUIDAM") throw new Error("대상이 FRUIDAM 프로젝트인지 확인해주세요.");
  const source = await readFile("data/studio.json", "utf8");
  const projects = JSON.parse(source);
  if (!Array.isArray(projects) || projects.some(project => !/^[a-f0-9-]{36}$/i.test(project.id) || !project.product || !Array.isArray(project.sections) || project.sections.length < 1 || project.sections.length > 30)) throw new Error("이전할 로컬 작업 데이터 형식을 확인해주세요.");
  const before = await rpc(config, "FRUIDAM_load_projects", {});
  if (!Array.isArray(before)) throw new Error("원격 작업 목록을 확인하지 못했어요.");
  const remote = new Map(before.map(row => [row.project.id, row.project]));
  for (const project of projects) if (remote.has(project.id) && !isDeepStrictEqual(remote.get(project.id), project)) throw new Error("같은 ID의 다른 원격 작업이 있어 이전을 중단했습니다. 원격 작업을 덮어쓰지 않았습니다.");
  const missing = projects.filter(project => !remote.has(project.id));
  const backupDirectory = path.join("data", "backups");
  await mkdir(backupDirectory, { recursive: true });
  const backup = path.join(backupDirectory, `studio-before-supabase-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backup, source, { flag: "wx" });
  if (missing.length) await rpc(config, "FRUIDAM_apply_changes", { changes: missing.map((project, index) => ({ project, position: before.length + index, expected_revision: 0 })), deletions: [] });
  const after = await rpc(config, "FRUIDAM_load_projects", {});
  for (const project of projects) if (!isDeepStrictEqual(after.find(row => row.project.id === project.id)?.project, project)) throw new Error("이전한 작업의 내용 검증에 실패했습니다. 로컬 원본은 유지됩니다.");
  if (await readFile("data/studio.json", "utf8") !== source) throw new Error("이전 중 로컬 작업이 변경됐습니다. 저장소를 전환하지 말고 변경 내용을 확인해주세요.");
  const result = { project_ref: config.ref, projects: projects.length, sections: projects.reduce((sum, project) => sum + project.sections.length, 0), source_sha256: createHash("sha256").update(source).digest("hex"), backup, imported_at: new Date().toISOString() };
  await writeFile("data/supabase-import-summary.json", JSON.stringify(result, null, 2));
  console.log(`이전 및 원문 대조 완료: ${result.projects}개 작업 / ${result.sections}개 섹션. 로컬 원본과 백업을 유지했습니다.`);
  console.log("사진 파일과 Gemini/농사로 키는 로컬에 남아 있습니다. 검증 후 FRUIDAM_STORAGE=supabase로 전환하세요.");
} catch (error) { console.error(error instanceof Error ? error.message : "Supabase 데이터 이전 실패"); process.exitCode = 1; }
