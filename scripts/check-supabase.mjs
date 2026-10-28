import { configuration, rpc } from "./supabase-helpers.mjs";
try {
  const rows = await rpc(configuration(), "FRUIDAM_load_projects", {});
  if (!Array.isArray(rows)) throw new Error("작업 목록을 확인하지 못했어요.");
  console.log(`Supabase 연결 확인: ${rows.length}개 작업 / ${rows.reduce((sum, row) => sum + row.project.sections.length, 0)}개 섹션.`);
} catch (error) { console.error(error instanceof Error ? error.message : "Supabase 연결 확인 실패"); process.exitCode = 1; }
