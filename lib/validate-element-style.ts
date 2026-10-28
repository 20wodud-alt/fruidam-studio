import { skinIds } from "./design-skins";
import { fontIds } from "./fonts";
import type { DesignElement, PhotoFormat, SectionFormat, TextFormat } from "./studio";
type Dict = Record<string, unknown>;
function object(value: unknown): Dict { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("편집 스타일을 확인해주세요."); return value as Dict; }
function number(value: unknown, min: number, max: number): number | undefined { if (value === undefined) return; if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error("편집 수치가 허용 범위를 벗어났어요."); return value; }
function choice<T extends string>(value: unknown, allowed: readonly T[]): T | undefined { if (value === undefined) return; if (!allowed.includes(value as T)) throw new Error("편집 옵션을 확인해주세요."); return value as T; }
function flag(value: unknown) { if (value === undefined) return; if (typeof value !== "boolean") throw new Error("편집 옵션을 확인해주세요."); return value; }
function group(value: unknown): string | undefined { if (value === undefined) return; if (typeof value !== "string" || !/^[a-zA-Z0-9-]{1,100}$/.test(value)) throw new Error("Invalid group id"); return value; }
function color(value: unknown): string | undefined { if (value === undefined) return; if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error("색상 값을 확인해주세요."); return value; }
export function validateTextFormat(value: unknown): TextFormat | undefined {
  if (value === undefined) return;
  const v = object(value);
  return { opacity: number(v.opacity,0,100), zIndex: number(v.zIndex,0,50), strike:flag(v.strike), superscript:flag(v.superscript), highlight:color(v.highlight), strokeWidth:number(v.strokeWidth,0,6), strokeColor:color(v.strokeColor), shadow:flag(v.shadow), shadowX:number(v.shadowX,-20,20), shadowY:number(v.shadowY,-20,20), shadowBlur:number(v.shadowBlur,0,30), shadowColor:color(v.shadowColor), curve:number(v.curve,-80,80), listStyle:choice(v.listStyle,["none","bullet","number"]), widthPx:number(v.widthPx,20,860), fontSize: number(v.fontSize, 10, 120), font: choice(v.font, fontIds), weight: number(v.weight, 100, 900), italic: flag(v.italic), underline: flag(v.underline), align: choice(v.align, ["left", "center", "right"]), color: color(v.color), lineHeight: number(v.lineHeight, .8, 3), letterSpacing: number(v.letterSpacing, -5, 15), hidden: flag(v.hidden), offsetX: number(v.offsetX, -860, 860), offsetY: number(v.offsetY, -1400, 1400), rotation: number(v.rotation, -180, 180), locked: flag(v.locked), groupId: group(v.groupId) };
}
export function validateSectionFormat(value: unknown): SectionFormat | undefined {
  if (value === undefined) return;
  const v = object(value); let image: PhotoFormat | undefined;
  if (v.image !== undefined) { const p = object(v.image); image = { widthPx:number(p.widthPx,20,860), height: number(p.height, 100, 8000), width: number(p.width, 20, 100), radius: number(p.radius, 0, 250), fit: choice(p.fit, ["cover", "contain"]), position: choice(p.position, ["top", "center", "bottom"]), brightness: number(p.brightness, 0, 200), contrast: number(p.contrast, 0, 200), saturation: number(p.saturation, 0, 200), opacity: number(p.opacity, 10, 100), flipY: flag(p.flipY), grayscale: flag(p.grayscale), zIndex: number(p.zIndex, 0, 50), flip: flag(p.flip), hidden: flag(p.hidden), offsetX: number(p.offsetX, -860, 860), offsetY: number(p.offsetY, -1400, 1400), rotation: number(p.rotation, -180, 180), locked: flag(p.locked), groupId: group(p.groupId) }; }
  return { skin:choice(v.skin,skinIds), minHeight:number(v.minHeight,100,8000), title: validateTextFormat(v.title), body: validateTextFormat(v.body), kicker: validateTextFormat(v.kicker), image, background: color(v.background), padding: number(v.padding, 0, 160) };
}
export function validateElements(value: unknown, validateImage: (value: unknown) => string): DesignElement[] | undefined {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.length > 20) throw new Error("추가 요소는 페이지당 20개까지 넣을 수 있어요.");
  const elements = value.map(item => { const v = object(item); if (typeof v.id !== "string" || !/^[a-z0-9-]{1,100}$/i.test(v.id) || typeof v.text !== "string" || v.text.length > 3000) throw new Error("추가 요소를 확인해주세요."); const type = choice(v.type, ["text", "badge", "divider", "image"]); if (!type) throw new Error("요소 종류가 필요해요."); return { id: v.id, type, text: v.text, format: validateTextFormat(v.format), background: color(v.background), shape: choice(v.shape, ["pill", "circle", "box"]), image: type === "image" ? validateImage(v.image) : undefined, photoFormat: v.photoFormat === undefined ? undefined : validateSectionFormat({ image: v.photoFormat })?.image, absolute: flag(v.absolute), x: number(v.x, -860, 1720), y: number(v.y, -1400, 50000), widthPx: number(v.widthPx, 20, 860) }; });
  if (new Set(elements.map(e => e.id)).size !== elements.length) throw new Error("중복된 요소가 있어요."); return elements;
}
