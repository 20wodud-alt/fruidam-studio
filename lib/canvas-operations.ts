import { fontCatalog } from "./fonts";
import { elementText } from "./element-style";
import type { DesignElement, PhotoFormat, Section, TextFormat } from "./studio";
export type CanvasFormat = TextFormat & PhotoFormat;
export type ElementMetric = { x: number; y: number; width: number; height: number; fontSize: number; textFormat?: TextFormat };
export function measureElement(node: HTMLElement, parent: DOMRect, ratio: number, dx = 0, dy = 0): ElementMetric {
  const rect = node.getBoundingClientRect(), css = getComputedStyle(node.dataset.element === "body" ? node.querySelector("p") || node : node), size = parseFloat(css.fontSize) || 20;
  const rgb = css.color.match(/\d+/g); const color = rgb && rgb.length >= 3 ? "#" + rgb.slice(0,3).map(c => Number(c).toString(16).padStart(2,"0")).join("") : "#292c29";
  return {x:(rect.left-parent.left)/ratio+dx,y:(rect.top-parent.top)/ratio+dy,width:node.offsetWidth,height:node.offsetHeight,fontSize:size,textFormat:{fontSize:size,weight:parseInt(css.fontWeight)||400,align:["left","right"].includes(css.textAlign)?css.textAlign as "left"|"right":"center",color,lineHeight:Math.max(.8,Math.min(3,parseFloat(css.lineHeight)/size || 1.7)),letterSpacing:Math.max(-5,Math.min(15,parseFloat(css.letterSpacing)||0)),font:fontCatalog.find(font=>css.fontFamily.includes(font.family))?.id || "sans"}};
}
export function targetFormat(section: Section, target: string): CanvasFormat {
  const extra = section.elements?.find(e => `extra:${e.id}` === target);
  if (extra) return (extra.type === "image" ? extra.photoFormat : extra.format) || {};
  return (section.format?.[target as "title" | "body" | "kicker" | "image"] || {}) as CanvasFormat;
}
export function setTargetFormat(section: Section, target: string, patch: Partial<CanvasFormat>): Section {
  const extra = section.elements?.find(e => `extra:${e.id}` === target);
  if((target==="image"||extra?.type==="image") && patch.width!==undefined && patch.widthPx===undefined)patch={...patch,widthPx:undefined};
  if (extra) return { ...section, elements: section.elements?.map(e => e.id === extra.id ? e.type === "image" ? { ...e, photoFormat: { ...e.photoFormat, ...patch } } : { ...e, format: { ...e.format, ...patch } } : e) };
  if (!["title", "body", "kicker", "image"].includes(target)) return section;
  return { ...section, format: { ...section.format, [target]: { ...targetFormat(section, target), ...patch } } };
}
export function targetsIn(section: Section) { return ["title", "kicker", "body", ...(section.image ? ["image"] : []), ...(section.elements || []).map(e => `extra:${e.id}`)]; }
export function groupedTargets(section: Section, target: string) { const group = targetFormat(section, target).groupId; return group ? targetsIn(section).filter(t => targetFormat(section, t).groupId === group) : [target]; }
export function moveTargets(section: Section, targets: string[], dx: number, dy: number): Section {
  return targets.reduce((next, target) => { const f = targetFormat(section, target); return f.locked ? next : setTargetFormat(next, target, { offsetX: Math.max(-860, Math.min(860, (f.offsetX || 0) + dx)), offsetY: Math.max(-1400, Math.min(1400, (f.offsetY || 0) + dy)) }); }, section);
}
export function duplicateTargets(section: Section, targets: string[], metrics: Record<string, ElementMetric>, limit = 20): { section: Section; targets: string[] } {
  const elements = [...(section.elements || [])]; const nextTargets: string[] = []; const groupId = targets.length > 1 ? crypto.randomUUID() : undefined;
  for (const target of targets) {
    if (elements.length >= limit) break;
    const metric = metrics[target]; if (!metric) continue;
    const extra = section.elements?.find(e => `extra:${e.id}` === target); const format = targetFormat(section, target);
    if (format.locked) continue;
    const image = target === "image" || extra?.type === "image";
    const id = crypto.randomUUID();
    const item: DesignElement = extra ? { ...structuredClone(extra), id } : image ? { id, type: "image", image: section.image, text: "복사한 사진" } : { id, type: "text", text: elementText(section, target) };
    item.absolute = true; item.x = metric.x; item.y = metric.y; item.widthPx = Math.max(20, Math.min(860, metric.width));
    if (image) item.photoFormat = { ...format, height: Math.max(100, Math.min(8000, metric.height)), width: 100, offsetX: 0, offsetY: 0, locked: false, hidden: false, groupId };
    else item.format = { ...metric.textFormat, ...format, fontSize: Math.max(10, Math.min(120, metric.fontSize || 20)), offsetX: 0, offsetY: 0, locked: false, hidden: false, groupId };
    elements.push(item); nextTargets.push(`extra:${id}`);
  }
  return { section: { ...section, elements }, targets: nextTargets };
}
export function resizeTargets(section: Section, targets: string[], metrics: Record<string, ElementMetric>, scaleX: number, scaleY: number, dx = 0, dy = 0): Section {
  let next = section;
  for (const target of targets) {
    const metric = metrics[target], f = targetFormat(section, target); if (!metric || f.locked) continue;
    const extra = section.elements?.find(e => `extra:${e.id}` === target); const isImage = target === "image" || extra?.type === "image";
    next = setTargetFormat(next, target, { offsetX: Math.max(-860, Math.min(860, (f.offsetX || 0) + dx)), offsetY: Math.max(-1400, Math.min(1400, (f.offsetY || 0) + dy)), ...(isImage ? { height: Math.max(100, Math.min(8000, metric.height * scaleY)), ...(!extra?.absolute ? { widthPx: Math.max(20, Math.min(860, metric.width * scaleX)) } : {}) } : { widthPx:Math.max(20,Math.min(860,metric.width*scaleX)), fontSize: Math.max(10, Math.min(120, metric.fontSize * scaleY)) }) });
    if (extra?.absolute) next = { ...next, elements: next.elements?.map(e => e.id === extra.id ? { ...e, widthPx: Math.max(20, Math.min(860, (extra.widthPx || metric.width) * scaleX)) } : e) };
  }
  return next;
}
