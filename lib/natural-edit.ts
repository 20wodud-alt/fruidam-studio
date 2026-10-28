import { parseResizeInstruction, type ResizeInstruction } from "./resize-instruction";
import type { PhotoFormat, TextFormat } from "./studio";
import { fontCatalog } from "./fonts";
export type LocalInstruction = ResizeInstruction | { type: "text"; target?: "title" | "body" | "kicker"; text: string } | { type: "format"; format: TextFormat; fontDelta?: number } | { type: "photo"; format: PhotoFormat } | { type: "move"; x: number; y: number } | { type: "action"; action: "duplicate" | "delete" | "undo" | "redo" | "hide" | "show" };
export function parseInstruction(request: string): LocalInstruction | null {
  const input = request.trim();
  const direct = input.match(/^(제목|메인\s*문구|본문|서브\s*카피)\s*[:：]\s*([\s\S]+)$/);
  if (direct) return { type: "text", target: /제목|메인/.test(direct[1]) ? "title" : /서브/.test(direct[1]) ? "kicker" : "body", text: direct[2] };
  // Do not partially execute a creative or multi-target command. Gemini must
  // receive the complete instruction rather than silently dropping half of it.
  if (/가지|항목|쿠팡|후킹|추가|요약|재작성|문단|작성|카피.*(?:바꿔|수정)|고급스럽|전문적|친근|배경|테마|레이아웃/.test(input)) return null;
  if (new Set(input.match(/제목|본문|서브\s*카피/g)).size > 1) return null;
  const resize=parseResizeInstruction(input);
  if(resize)return resize;
  const numericSizes = [...input.matchAll(/\d+(?:\.\d+)?\s*(?:px|pt|픽셀|포인트)/gi)];
  if (numericSizes.length > 1 || /그리고|동시에/.test(input) && /사진|이미지/.test(input) && /글씨|글자|제목|본문/.test(input)) return null;
  if (numericSizes.length && /복제|복사|삭제|되돌|취소/.test(input)) return null;
  if (/사진|이미지/.test(input)) {
    if ((input.match(/밝기|대비|채도|불투명도|높이|너비|둥글기|반전|회전/g) || []).length>1) return null;
    if (/좌우\s*반전|가로\s*반전/.test(input)) return { type: "photo", format: { flip: true } };
    const photoValue = input.match(/(밝기|대비|채도|불투명도|높이|너비|둥글기)\s*(?:를|을)?\s*(\d{1,4})/);
    if (photoValue) { const value = Number(photoValue[2]); const key = ({ 밝기: "brightness", 대비: "contrast", 채도: "saturation", 불투명도: "opacity", 높이: "height", 너비: "width", 둥글기: "radius" } as const)[photoValue[1] as "밝기" | "대비" | "채도" | "불투명도" | "높이" | "너비" | "둥글기"]; const min = key === "height" ? 100 : key === "width" ? 20 : key === "opacity" ? 10 : 0; const max = key === "height" ? 1400 : key === "radius" ? 250 : key === "width" || key === "opacity" ? 100 : 200; return { type: "photo", format: { [key]: Math.max(min, Math.min(max, value)) } }; }
    if (/전체\s*보이|전체\s*맞춤/.test(input)) return { type: "photo", format: { fit: "contain" } };
  }
  const replacement = input.match(/^(제목|본문|서브\s*카피)(?:을|를)?\s*["“'](.+?)["”']\s*(?:으?로)\s*(?:바꿔|변경|수정)/);
  if (replacement) return { type: "text", target: replacement[1] === "제목" ? "title" : replacement[1] === "본문" ? "body" : "kicker", text: replacement[2].replace(/["”']$/, "") };
  const movement = input.match(/(왼쪽|오른쪽|위로|아래로|위쪽|아래쪽)\s*(\d{1,3})\s*(?:px|픽셀)?/);
  if (movement && /이동|옮|움직/.test(input)) { const value = Number(movement[2]); return { type: "move", x: movement[1] === "왼쪽" ? -value : movement[1] === "오른쪽" ? value : 0, y: /위/.test(movement[1]) ? -value : /아래/.test(movement[1]) ? value : 0 }; }
  const defaultMove=input.match(/^(?:(?:선택한|현재|이거|이|글씨|글자|텍스트|사진|이미지|요소|본문|제목|서브\s*카피)(?:을|를)?\s*)*(?:조금|살짝)?\s*(?:(왼쪽|오른쪽|위|아래)(?:으로|로)?\s*)?(?:이동(?:해)?|옮겨|움직여)\s*(?:줘|죠|주세요)?[.!]?$/);
  if(defaultMove)return {type:"move",x:defaultMove[1]==="왼쪽"?-20:/위|아래/.test(defaultMove[1]||"")?0:20,y:defaultMove[1]==="위"?-20:defaultMove[1]==="아래"?20:0};
  const format: TextFormat = {};
  const size = input.match(/(\d{1,3}(?:\.\d+)?)\s*(px|pt|픽셀|포인트)/i) || input.match(/(?:글씨|글자|폰트|텍스트|제목|본문|크기)(?:\s*크기)?(?:를|을|는|은)?\s*(\d{1,3})(?=\s*(?:$|로|으로|키워|크게|줄여|작게|해|변경))/);
  if (size && !/사진|이미지/.test(input)) format.fontSize = Math.max(10, Math.min(120, Number(size[1]) * (/^(pt|포인트)$/i.test(size[2] || "") ? 4/3 : 1)));
  const color = input.match(/#[0-9a-f]{6}|빨강|빨간|레드|초록|녹색|그린|검정|검은|흰색|하얀|파랑|파란|보라/gi)?.[0];
  if (color && /색|글씨|글자|제목|본문|텍스트/.test(input)) format.color = color.startsWith("#") ? color : /빨|레드/.test(color) ? "#b55443" : /초록|녹색|그린/.test(color) ? "#426c4c" : /흰|하얀/.test(color) ? "#ffffff" : /파랑|파란/.test(color) ? "#426eaa" : /보라/.test(color) ? "#74608d" : "#292c29";
  if (/가운데\s*정렬|중앙\s*정렬/.test(input)) format.align = "center";
  if (/왼쪽\s*정렬/.test(input)) format.align = "left";
  if (/오른쪽\s*정렬/.test(input)) format.align = "right";
  if (/굵게|볼드|진하게/.test(input)) format.weight = /해제|빼|말고/.test(input) ? 400 : 700;
  if (/기울임|이탤릭/.test(input)) format.italic = !/해제|빼|말고/.test(input);
  if (/밑줄/.test(input)) format.underline = !/해제|빼|말고/.test(input);
  if (/잠금|잠궈|잠가/.test(input)) format.locked = !/해제|풀어/.test(input);
  const font = fontCatalog.find(f=>input.includes(f.family) || input.includes(f.name.split(" · ")[0]));
  if (font) format.font = font.id;
  const spacing = input.match(/(?:줄\s*간격|행간)\s*(?:을|를)?\s*(\d(?:\.\d+)?)/);
  if (spacing) format.lineHeight = Math.max(.8,Math.min(3,Number(spacing[1])));
  const tracking = input.match(/자간\s*(?:을|를)?\s*(-?\d+(?:\.\d+)?)/);
  if (tracking) format.letterSpacing = Math.max(-5,Math.min(15,Number(tracking[1])));
  const rotation = input.match(/(-?\d{1,3})\s*도.*회전|회전\s*(-?\d{1,3})\s*도?/);
  if (rotation) format.rotation = Math.max(-180, Math.min(180, Number(rotation[1] || rotation[2])));
  const relative = !size && /(?:글씨|글자|폰트|텍스트|제목|본문).*(?:키워|크게|늘려|줄여|작게)|^(?:좀\s*|더\s*)?(?:키워|크게|줄여|작게)/.test(input);
  if (Object.keys(format).length || relative) return {type:"format",format,...(relative?{fontDelta:/줄여|작게/.test(input)?-4:4}:{})};
  if (/복제|복사해/.test(input)) return { type: "action", action: "duplicate" };
  if (/삭제해|지워줘|^삭제$/.test(input)) return { type: "action", action: "delete" };
  if (/실행\s*취소|되돌려|이전\s*작업/.test(input)) return { type: "action", action: "undo" };
  if (/다시\s*실행/.test(input)) return { type: "action", action: "redo" };
  if (/숨겨|숨기기/.test(input)) return { type: "action", action: "hide" };
  if (/표시해|다시\s*보여/.test(input)) return { type: "action", action: "show" };
  return null;
}
