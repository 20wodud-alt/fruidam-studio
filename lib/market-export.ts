export type MarketPlatform = "smartstore" | "coupang";
export type MarketImageFormat = "jpg" | "png";
export const marketProfiles = {
  smartstore: { name: "스마트스토어", width: 848, maxHeight: 4000, maxBytes: 4_000_000, note: "상품 상세설명 공식 권장 너비 848px", source: "https://help.sell.smartstore.naver.com/faq/content.help?faqId=3923" },
  coupang: { name: "쿠팡", width: 780, maxHeight: 4000, maxBytes: 4_000_000, note: "상세 이미지 출력 프리셋 780px · 등록 화면 안내 우선", source: "https://marketplace.coupang.com/register" },
} as const;
export type TextBand = { top: number; bottom: number };
/** All coordinates are output pixels. Prefer section ends, then avoid text lines. */
export function tileEnd(start: number, limit: number, total: number, boundaries: number[], textBands: TextBand[]) {
  const max = Math.min(total, start + limit);
  if (max >= total) return total;
  const preferred = boundaries.filter(y => y > start + Math.min(256, limit / 4) && y <= max);
  let end = preferred.length ? Math.max(...preferred) : max;
  for (let i = 0; i < 200; i++) {
    const crossing = textBands.filter(b => b.top < end && b.bottom > end);
    if (!crossing.length) break;
    const safe = Math.floor(Math.min(...crossing.map(b => b.top))) - 1;
    if (safe <= start + 32) throw new Error("한 줄의 글씨가 너무 커서 분할하지 못했어요. 글자 크기를 줄여주세요.");
    end = safe;
  }
  if (textBands.some(b => b.top < end && b.bottom > end)) throw new Error("글씨가 겹쳐 분할 위치를 찾지 못했어요. 배치를 정리해주세요.");
  if (end <= start) throw new Error("이미지 분할 위치를 확인하지 못했어요.");
  return end;
}
export function escapeExportHtml(value: string) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!); }
export function exportStem(name: string) { return name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/[. ]+$/, "").slice(0, 90) || "상품"; }
