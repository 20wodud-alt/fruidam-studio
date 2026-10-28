import { readFile } from "node:fs/promises";
import { configuration, managementRequest } from "./supabase-helpers.mjs";

try {
  const config = configuration();
  const project = await managementRequest(config.ref, "");
  if (project.name !== "FRUIDAM") throw new Error("다른 프로젝트를 수정하지 않도록 중단했습니다. 프로젝트 이름이 FRUIDAM인지 확인해주세요.");
  if (project.status !== "ACTIVE_HEALTHY") throw new Error("FRUIDAM 프로젝트가 실행 준비 상태가 아닙니다.");
  const sql = await readFile(new URL("../supabase/migrations/202610280001_FRUIDAM_storage.sql", import.meta.url), "utf8");
  await managementRequest(config.ref, "/database/query", { query: sql });
  const check = await managementRequest(config.ref, "/database/query", { query: `select c.relname as table_name, c.relrowsecurity as rls, has_table_privilege('anon', c.oid, 'SELECT') as anon_select from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('FRUIDAM_projects', 'FRUIDAM_sections') order by c.relname;` });
  if (!Array.isArray(check) || check.length !== 2 || check.some(row => !row.rls || row.anon_select)) throw new Error("FRUIDAM 테이블 보안 설정을 확인하지 못했습니다.");
  console.log("FRUIDAM_projects / FRUIDAM_sections 생성 및 RLS·익명 접근 차단 확인 완료.");
} catch (error) { console.error(error instanceof Error ? error.message : "Supabase 초기화 실패"); process.exitCode = 1; }
