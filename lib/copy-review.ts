import type { Section } from "./studio";
export type CopyIssue = { label: string; detail: string };
export function copyIssues(section: Section): CopyIssue[] {
  const issues: CopyIssue[] = [];
  if (!section.title.trim()) issues.push({ label: "제목 누락", detail: "섹션을 소개할 제목을 입력해주세요." });
  if (!section.body.trim()) issues.push({ label: "본문 누락", detail: "고객에게 전할 내용을 입력해주세요." });
  if (section.title.length > 45) issues.push({ label: "긴 제목", detail: "한눈에 읽히도록 제목을 45자 안팎으로 다듬어보세요." });
  if (/100\s*%|최고|유일|1위|무조건|완벽|완치|치료/.test(`${section.title} ${section.body}`)) issues.push({ label: "표현 확인", detail: "수치·순위·효과를 단정하는 표현은 상품 자료와 일치하는지 확인해주세요." });
  if (/입력해주세요|추가해주세요/.test(section.body)) issues.push({ label: "초안 문구", detail: "안내용 문구를 실제 상품 정보로 바꿔주세요." });
  if (/[\t ]{2,}|[ \t]+\n/.test(`${section.title}\n${section.body}`)) issues.push({ label: "공백 확인", detail: "겹친 공백이나 줄 끝 공백이 있어요. 공백 정리로 다듬을 수 있어요." });
  return issues;
}
export function cleanCopy(value: string) { return value.split("\n").map(line => line.replace(/[\t ]+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim(); }
