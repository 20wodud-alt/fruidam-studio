import type { CSSProperties } from "react";
import type { PhotoFormat, Section, TextFormat } from "./studio";
export { fontFamilies } from "./fonts";
import { fontFamilies } from "./fonts";
export const defaultKickers = { hero: "A LITTLE BETTER, EVERY DAY", story: "OUR STORY", benefits: "WHY YOU'LL LOVE IT", detail: "A CLOSER LOOK", options: "CHOOSE YOUR FAVORITE", shipping: "DELIVERY GUIDE", faq: "QUESTIONS & ANSWERS" };
export function textCSS(value?: TextFormat): CSSProperties {
  if (!value) return {};
  return { width:value.widthPx, fontSize: value.fontSize, fontFamily: value.font ? fontFamilies[value.font] : undefined, fontWeight: value.weight, fontStyle: value.italic ? "italic" : undefined, textDecoration: value.underline || value.strike ? [value.underline ? "underline" : "", value.strike ? "line-through" : ""].filter(Boolean).join(" ") : undefined, opacity: value.opacity === undefined ? undefined : value.opacity / 100, WebkitTextStroke: value.strokeWidth ? `${value.strokeWidth}px ${value.strokeColor || "#426c4c"}` : undefined, paintOrder: value.strokeWidth ? "stroke fill" : undefined, textShadow: value.shadow ? `${value.shadowX ?? 2}px ${value.shadowY ?? 3}px ${value.shadowBlur ?? 4}px ${value.shadowColor || "#a2aaa0"}` : undefined, textAlign: value.align, color: value.color, lineHeight: value.lineHeight, letterSpacing: value.letterSpacing, display: value.hidden ? "none" : undefined, position: value.offsetX || value.offsetY || value.zIndex !== undefined ? "relative" : undefined, zIndex: value.zIndex, left: value.offsetX, top: value.offsetY, transform: value.rotation ? `rotate(${value.rotation}deg)` : undefined };
}
export function photoCSS(value?: PhotoFormat): CSSProperties {
  if (!value) return {};
  return { height: value.height, maxHeight: value.height === undefined ? undefined : "none", maxWidth:value.widthPx===undefined?undefined:"none", width: value.widthPx ?? (value.width === undefined ? undefined : `${value.width}%`), borderRadius: value.radius, objectFit: value.fit, objectPosition: value.position, filter: `brightness(${value.brightness ?? 100}%) contrast(${value.contrast ?? 100}%) saturate(${value.saturation ?? 100}%) grayscale(${value.grayscale ? 100 : 0}%)`, opacity: value.opacity === undefined ? undefined : value.opacity / 100, transform: value.flip || value.flipY || value.rotation ? `rotate(${value.rotation || 0}deg) scaleX(${value.flip ? -1 : 1}) scaleY(${value.flipY ? -1 : 1})` : undefined, display: value.hidden ? "none" : undefined, marginLeft: value.widthPx===undefined ? "auto" : `calc(50% - ${value.widthPx/2}px)`, marginRight: value.widthPx===undefined ? "auto" : 0, position: value.offsetX || value.offsetY || value.zIndex !== undefined ? "relative" : undefined, zIndex:value.zIndex, left: value.offsetX, top: value.offsetY };
}
export function elementText(section: Section, target: string) {
  if (target === "title") return section.title;
  if (target === "body") return section.body;
  if (target === "kicker") return section.kicker ?? defaultKickers[section.kind];
  return section.elements?.find(e => `extra:${e.id}` === target)?.text || "";
}
export const elementNames: Record<string, string> = { section: "페이지", title: "메인 제목", body: "본문", kicker: "서브 카피", image: "사진" };
