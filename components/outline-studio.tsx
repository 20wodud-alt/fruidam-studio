"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronRight, CircleHelp, Copy, Eye, EyeOff, FileText, GripVertical, ImagePlus, Keyboard, Layers3, ListTree, LayoutTemplate, ListChecks, MessageSquareText, Palette, Plus, Redo2, Search, Settings2, Shapes, Sparkles, Trash2, Type, Undo2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { DetailPage } from "./detail-page";
import { applyDesignSkin, designSkins, type SkinId, type SkinScope } from "@/lib/design-skins";
import { applyLayerAction, type LayerAction } from "@/lib/project-layers";
import { scrollCanvasToElement } from "@/lib/canvas-navigation";
import { ElementProperties } from "./element-properties";
import { EditorToolLibrary, type EditorTool } from "./editor-tool-library";
import { useEditorShortcuts } from "./use-editor-shortcuts";
import { ShortcutGuide } from "./shortcut-guide";
import type { ImageRequest } from "@/lib/image-plan";
import { InlineTextEditor, type InlineTextState } from "./inline-text-editor";
import { CommandComposer } from "./command-composer";
import { useCanvasTransform } from "./use-canvas-transform";
import { duplicateTargets, groupedTargets, measureElement, moveTargets, setTargetFormat, targetFormat } from "@/lib/canvas-operations";
import type {EditorMetrics} from "@/lib/editor-metrics";
import { applyLocalEditorRequest, editSectionIds } from "@/lib/local-editor";
import type { AssistantAttachment } from "@/lib/assistant-attachments";
import { insertPageAfter, resizePage, type InsertPageKind } from "@/lib/page-operations";
import { parseInstruction } from "@/lib/natural-edit";
import type { ShortcutAction } from "@/lib/editor-shortcuts";
import { cleanCopy } from "@/lib/copy-review";
import { elementText } from "@/lib/element-style";
import { emptyDesignBrief, sectionNames, themes, type DesignElement, type TextFormat, type PhotoFormat, type SectionFormat, type Section, type StudioProject } from "@/lib/studio";

type Tool = EditorTool;
const tools: { id: Tool; label: string; icon: typeof Type }[] = [
  { id: "pages", label: "페이지", icon: Layers3 }, { id: "text", label: "텍스트", icon: Type },
  { id: "photos", label: "사진", icon: ImagePlus }, { id: "reference", label: "레퍼런스", icon: Copy },
  { id: "layout", label: "구성", icon: LayoutTemplate }, { id: "elements", label: "요소", icon: Shapes }, { id: "layers", label: "레이어", icon: ListTree }, { id: "color", label: "색상", icon: Palette },
];
type Props = {
  imageGenerating:boolean; onGenerateImages:(request?:ImageRequest)=>Promise<void>;
  project: StudioProject; selectedId: string; onSelect: (id: string) => void; onChange: (project: StudioProject) => void;
  onAdd: () => void; onUpload: (target?: string) => void; onPasteImage: (files: File[], target: string) => void; onSave: () => void; onExport: () => void; uploading: boolean; onReview: () => void; onBack: () => void;
  onEditBrief: () => void; onHelp: () => void; onAISettings: () => void; saveState: "saved" | "saving" | "error";
};
export function OutlineStudio({ project, selectedId, onSelect, onChange, onAdd, onUpload, onPasteImage, onSave, onExport, uploading, onReview, onBack, onEditBrief, onHelp, onAISettings, saveState, imageGenerating, onGenerateImages }: Props) {
  const [inlineEditing,setInlineEditing]=useState<InlineTextState|null>(null);
  const [tool, setTool] = useState<Tool>("pages");
  const [elementTarget, setElementTarget] = useState("section");
  const [elementNotice, setElementNotice] = useState("");
  const [panel, setPanel] = useState<"edit" | "assistant">("edit");
  const [zoom, setZoom] = useState(50);
  const [search, setSearch] = useState("");
  const [mobilePages, setMobilePages] = useState(false);
  const [command, setCommand] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const requestLock = useRef(false);
  const [selectionTargets, setSelectionTargets] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ id: number; request: string; response: string; success: boolean }[]>([]);
  const [history, setHistory] = useState<{ past: StudioProject[]; future: StudioProject[] }>({ past: [], future: [] });
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [shortcutNotice, setShortcutNotice] = useState("");
  const clipboard = useRef<{ kind: "elements"; elements: DesignElement[] } | { kind: "section"; section: Section } | { kind: "element"; element: Omit<DesignElement, "id"> } | null>(null);
  const styleClipboard = useRef<{ kind: "text"; format: TextFormat } | { kind: "photo"; format: PhotoFormat } | { kind: "section"; format: SectionFormat } | null>(null);
  const trackedProject = useRef(project);
  const viewportRef = useRef<HTMLDivElement>(null);
  const propertiesRef = useRef<HTMLElement>(null);
  const dragged = useRef("");
  const selected = project.sections.find(s => s.id === selectedId) || project.sections[0];
  const visible = project.sections.filter(s => s.visible);
  const selectedIndex = project.sections.findIndex(s => s.id === selected?.id);
  const [pageHeight, setPageHeight] = useState(0);
  const documentRef = useRef<HTMLDivElement>(null);
  const activeTargets = elementTarget === "section" ? [] : selectionTargets.includes(elementTarget) ? selectionTargets : [elementTarget];
  const transform = useCanvasTransform({ project, selectedId, targets: activeTargets, zoom, viewportRef, documentRef, onCommit: commit, onSelect: (id, targets, active) => { onSelect(id); setSelectionTargets(targets); setElementTarget(active || targets.at(-1) || "section"); setPanel("edit"); const token = active || targets.at(-1); const extraPhoto = project.sections.find(s => s.id === id)?.elements?.some(e => `extra:${e.id}` === token && e.type === "image"); setTool(current => current === "layers" ? "layers" : token === "image" || extraPhoto ? "photos" : token?.startsWith("extra:") ? "elements" : "text"); } });
  useEffect(() => {
    const previous = trackedProject.current; trackedProject.current = project;
    if (JSON.stringify(previous) !== JSON.stringify(project)) queueMicrotask(() => setHistory(current => ({ past: [...current.past, previous].slice(-60), future: [] })));
  }, [project]);
  useEffect(() => { if (!shortcutNotice) return; const timer = setTimeout(() => setShortcutNotice(""), 2500); return () => clearTimeout(timer); }, [shortcutNotice]);
  useEffect(() => {
    const element = viewportRef.current; if (!element) return;
    function wheel(e: WheelEvent) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setZoom(value => Math.max(25, Math.min(100, value + (e.deltaY < 0 ? 5 : -5)))); }
    element.addEventListener("wheel", wheel, { passive: false }); return () => element.removeEventListener("wheel", wheel);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(entries => setZoom(Math.max(25, Math.min(60, Math.floor((entries[0].contentRect.width - 125) / 860 * 20) * 5))));
    observer.observe(viewport); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const element = documentRef.current?.querySelector(".product-page");
    if (!element) return;
    const observer = new ResizeObserver(() => setPageHeight(element.scrollHeight));
    observer.observe(element); return () => observer.disconnect();
  }, []);

  function startInline(sectionId:string,target:string){
    const section=trackedProject.current.sections.find(s=>s.id===sectionId);const node=documentRef.current?.querySelector<HTMLElement>(`[data-section="${sectionId}"] [data-element="${target}"]`);const viewport=viewportRef.current;if(!section || !node || !viewport)return;
    const rect=node.getBoundingClientRect(),v=viewport.getBoundingClientRect(),css=getComputedStyle(node.querySelector("p") || node);onSelect(sectionId);setElementTarget(target);setSelectionTargets([target]);
    setInlineEditing({sectionId,target,text:elementText(section,target),left:rect.left-v.left+viewport.scrollLeft,top:rect.top-v.top+viewport.scrollTop,width:rect.width,height:rect.height,style:{fontFamily:css.fontFamily,fontSize:Math.max(13,parseFloat(css.fontSize)*zoom/100),fontWeight:css.fontWeight,color:css.color,textAlign:css.textAlign as "left"|"center"|"right",lineHeight:1.6}});
  }
  function finishInline(text:string){
    if(!inlineEditing)return;const current=trackedProject.current;const {sectionId,target}=inlineEditing;
    commit({...current,sections:current.sections.map(s=>s.id!==sectionId?s:target.startsWith("extra:")?{...s,reviewed:false,elements:s.elements?.map(e=>`extra:${e.id}`===target?{...e,text}:e)}:{...s,[target]:text,reviewed:false})});setInlineEditing(null);
  }
  function commit(next: StudioProject) {
    const previous = trackedProject.current;
    if (JSON.stringify(next) === JSON.stringify(previous)) return;
    trackedProject.current = next;
    setHistory(current => ({ past: [...current.past, previous].slice(-60), future: [] })); onChange(next);
  }
  function update(patch: Partial<Section>) {
    if (!selected) return;
    if(patch.image!==undefined && !("imageMeta" in patch))patch={...patch,imageMeta:undefined};
    commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? { ...s, ...patch, ...("title" in patch || "body" in patch || "kicker" in patch || "elements" in patch ? { reviewed: false } : {}) } : s) });
  }
  function undo() {
    const previous = history.past.at(-1); if (!previous) return;
    trackedProject.current = previous;
    setHistory({ past: history.past.slice(0, -1), future: [project, ...history.future] }); onChange(previous);
    if (!previous.sections.some(s => s.id === selectedId)) onSelect(previous.sections[0].id);
    if (elementTarget.startsWith("extra:") && !previous.sections.find(s => s.id === selectedId)?.elements?.some(e => `extra:${e.id}` === elementTarget)) setElementTarget("section");
  }
  function redo() {
    const next = history.future[0]; if (!next) return;
    trackedProject.current = next;
    setHistory({ past: [...history.past, project], future: history.future.slice(1) }); onChange(next);
    if (!next.sections.some(s => s.id === selectedId)) onSelect(next.sections[0].id);
    if (elementTarget.startsWith("extra:") && !next.sections.find(s => s.id === selectedId)?.elements?.some(e => `extra:${e.id}` === elementTarget)) setElementTarget("section");
  }
  function clearElementSelection() {
    setSelectionTargets([]);
    setElementTarget("section");
    setTool(current => current === "layers" ? "layers" : "pages");
  }
  function applySkin(id: SkinId, scope: SkinScope) {
    commit(applyDesignSkin(trackedProject.current, id, scope, selectedId));
    setElementTarget("section"); setSelectionTargets([]); setTool("layout");
    const name = designSkins.find(skin => skin.id === id)?.name || id;
    setShortcutNotice(`${name} \uC2A4\uD0A8\uC744 \uC801\uC6A9\uD588\uC5B4\uC694.`);
  }
  function selectLayer(sectionId: string, target: string) {
    onSelect(sectionId); setElementTarget(target); setSelectionTargets(target === "section" ? [] : [target]);
    setTool("layers"); setPanel("edit"); setMobilePages(false);
    requestAnimationFrame(() => {
      const page = documentRef.current?.querySelector(`[data-section="${sectionId}"]`);
      scrollCanvasToElement(viewportRef.current, target === "section" ? page : page?.querySelector(`[data-element="${target}"]`), { block: target === "section" ? "start" : "center" });
    });
  }
  function changeLayer(sectionId: string, target: string, action: LayerAction) {
    try {
      commit(applyLayerAction(trackedProject.current, sectionId, target, action));
      if (action === "delete" && selectedId === sectionId && (elementTarget === target || activeTargets.includes(target))) {
        setElementTarget("section"); setSelectionTargets([]);
      }
    } catch (error) { setShortcutNotice(error instanceof Error ? error.message : "레이어를 수정하지 못했어요."); }
  }
  function select(id: string, scroll = false) {
    if (transform.suppressClick.current) return;
    setSelectionTargets([]);
    onSelect(id); setElementTarget("section"); setMobilePages(false);
    if (scroll) scrollCanvasToElement(viewportRef.current, documentRef.current?.querySelector(`[data-section="${id}"]`));
  }
  function move(direction: number) {
    if (!selected) return;
    const to = selectedIndex + direction;
    if (to < 0 || to >= project.sections.length) return;
    const sections = [...project.sections]; [sections[selectedIndex], sections[to]] = [sections[to], sections[selectedIndex]];
    commit({ ...project, sections });
  }
  function reorder(fromId: string, toId: string) {
    const from = project.sections.findIndex(s => s.id === fromId), to = project.sections.findIndex(s => s.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const sections = [...project.sections]; const [item] = sections.splice(from, 1); sections.splice(to, 0, item); commit({ ...project, sections });
  }
  function duplicate() {
    if (!selected || project.sections.length >= 30) return false;
    const copy = { ...selected, id: crypto.randomUUID(), reviewed: false, elements: selected.elements?.map(element => ({ ...element, id: crypto.randomUUID() })) };
    const sections = [...project.sections]; sections.splice(selectedIndex + 1, 0, copy); commit({ ...project, sections }); onSelect(copy.id); return true;
  }
  function insertCanvasPage(afterId:string,kind:InsertPageKind){
    try{const result=insertPageAfter(trackedProject.current,afterId,kind);commit(result.project);onSelect(result.section.id);setSelectionTargets([]);setElementTarget(kind==="photo"?"image":"section");setTool(kind==="photo"?"photos":"layout");setPanel("edit");requestAnimationFrame(()=>scrollCanvasToElement(viewportRef.current,documentRef.current?.querySelector(`[data-section="${result.section.id}"]`),{block:"center"}));}
    catch(e){setShortcutNotice(e instanceof Error?e.message:"Unable to insert page.");}
  }
  function deleteCanvasPage(id:string){
    const current=trackedProject.current,index=current.sections.findIndex(s=>s.id===id),page=current.sections[index];
    if(!page || (page.visible && current.sections.filter(s=>s.visible).length<=1))return false;
    const sections=current.sections.filter(s=>s.id!==id);commit({...current,sections});
    if(id===selectedId){onSelect(sections[Math.min(index,sections.length-1)].id);setElementTarget("section");setSelectionTargets([]);}
    return true;
  }
  function remove() {
    if (!selected || (selected.visible && visible.length <= 1)) return false;
    const sections = project.sections.filter(s => s.id !== selected.id); commit({ ...project, sections }); onSelect(sections[Math.min(selectedIndex, sections.length - 1)].id); return true;
  }
  function toggle() {
    if (!selected || (selected.visible && visible.length <= 1)) return false;
    update({ visible: !selected.visible }); return true;
  }
  function chooseTool(next: Tool) {
    setTool(next); setPanel("edit");
    if (next === "pages" || next === "layout") setElementTarget("section");
    else if (next === "photos" && !photoSelected()) setElementTarget("image");
    else if (next === "text" && !["title", "body", "kicker"].includes(elementTarget) && !elementTarget.startsWith("extra:")) setElementTarget("title");
    if (next === "pages") setMobilePages(value => !value);
    else if (window.innerWidth <= 760) setMobilePages(true);
  }
  function selectElement(sectionId: string, target: string) {
    if (transform.suppressClick.current) return;
    const section = project.sections.find(s => s.id === sectionId);
    setSelectionTargets(section ? groupedTargets(section, target) : [target]);
    onSelect(sectionId); setElementTarget(target); setPanel("edit"); setMobilePages(false); setElementNotice("");
    const extraPhoto = project.sections.find(s => s.id === sectionId)?.elements?.find(e => `extra:${e.id}` === target)?.type === "image";
    setTool(current => current === "layers" ? "layers" : target === "image" || extraPhoto ? "photos" : target === "section" ? "pages" : target.startsWith("extra:") ? "elements" : "text");
  }
  function targetElement(target: string) {
    setSelectionTargets(target === "section" ? [] : groupedTargets(selected, target));
    setElementTarget(target); setPanel("edit"); setElementNotice(""); setMobilePages(false);
    if (tool !== "layers" && tool !== "elements") setTool(target === "image" ? "photos" : target === "section" ? "pages" : "text");
  }
  function addElement(source: Omit<DesignElement, "id">) {
    if (!selected) return;
    if ((selected.elements?.length || 0) >= 20) { setElementNotice("추가 요소는 페이지당 최대 20개까지 넣을 수 있어요."); return; }
    const element = { ...source, id: crypto.randomUUID() };
    update({ elements: [...(selected.elements || []), element] }); setElementTarget(`extra:${element.id}`); setPanel("edit"); setElementNotice(""); setMobilePages(false);
    requestAnimationFrame(() => scrollCanvasToElement(viewportRef.current,documentRef.current?.querySelector(`[data-section="${selected.id}"] [data-element="extra:${element.id}"]`),{block:"center"}));
  }
  function applyTextStyle(patch: TextFormat) {
    if (!selected) return;
    const extra = selected.elements?.find(e => `extra:${e.id}` === elementTarget);
    if (extra && extra.type !== "divider" && extra.type !== "image") update({ elements: selected.elements?.map(e => e.id === extra.id ? { ...e, format: { ...e.format, ...patch } } : e) });
    else {
      const key = (["title", "body", "kicker"].includes(elementTarget) ? elementTarget : "title") as "title" | "body" | "kicker";
      update({ format: { ...selected.format, [key]: { ...selected.format?.[key], ...patch } } }); setElementTarget(key);
    }
    setPanel("edit"); setMobilePages(false);
  }
  function duplicateElement() {
    if (!selected) return;
    const parent = documentRef.current?.querySelector<HTMLElement>(`[data-section="${selected.id}"]`);
    if (parent && activeTargets.length) {
      const rect = parent.getBoundingClientRect(), ratio = zoom/100;
      const metrics: Record<string, import("@/lib/canvas-operations").ElementMetric> = {};
      for (const target of activeTargets) { const node = parent.querySelector<HTMLElement>(`[data-element="${target}"]`); if (node) metrics[target] = measureElement(node,rect,ratio,16,16); }
      const copy = duplicateTargets(selected,activeTargets,metrics);
      update({ elements:copy.section.elements }); setSelectionTargets(copy.targets); setElementTarget(copy.targets.at(-1) || elementTarget); return;
    }
    const extra = selected.elements?.find(e => `extra:${e.id}` === elementTarget);
    if (extra) addElement({ ...extra });
    else if (elementTarget === "image") { if (selected.image) addElement({ type: "image", text: "추가한 상품 사진", image: selected.image, photoFormat: { ...selected.format?.image, hidden: false } }); }
    else {
      const key = (["title", "body", "kicker"].includes(elementTarget) ? elementTarget : "title") as "title" | "body" | "kicker";
      addElement({ type: "text", text: elementText(selected, key), format: { fontSize: key === "title" ? 38 : 20, ...selected.format?.[key] } });
    }
  }
  function deleteElement() {
    if (!selected || !elementTarget.startsWith("extra:")) return;
    update({ elements: selected.elements?.filter(e => `extra:${e.id}` !== elementTarget) }); setElementTarget("section");
  }
  function extraSelected() { return selected?.elements?.find(e => `extra:${e.id}` === elementTarget); }
  function textSelected() { const extra = extraSelected(); return ["title", "body", "kicker"].includes(elementTarget) || extra?.type === "text" || extra?.type === "badge" || extra?.type === "divider"; }
  function photoSelected() { return elementTarget === "image" || extraSelected()?.type === "image"; }
  function textFormat(): TextFormat {
    const extra = extraSelected(); if (extra) return extra.format || {};
    const key = elementTarget as "title" | "body" | "kicker";
    return { font: "sans", fontSize: key === "title" ? (selected.kind === "hero" ? 65 : 38) : key === "kicker" ? 12 : 19, weight: key === "title" || key === "kicker" ? 700 : 400, align: "center", color: key === "title" ? "#292c29" : key === "kicker" ? themes[project.product.theme].accent : "#74746c", ...selected.format?.[key] };
  }
  function currentPhotoFormat() { const extra = extraSelected(); return (extra?.type === "image" ? extra.photoFormat : selected.format?.image) || {}; }
  function setSelectedPhotoFormat(patch: Partial<PhotoFormat>) {
    if(patch.width!==undefined)patch={...patch,widthPx:undefined};
    const extra = extraSelected();
    if (extra?.type === "image") update({ elements: selected.elements?.map(e => e.id === extra.id ? { ...e, photoFormat: { ...e.photoFormat, ...patch } } : e) });
    else update({ format: { ...selected.format, image: { ...selected.format?.image, ...patch } } });
  }
  function setSelectedImage(image: string) {
    const extra = extraSelected();
    if (extra?.type === "image") update({ elements: selected.elements?.map(e => e.id === extra.id ? { ...e, image } : e) });
    else update({ image });
  }
  function libraryUpdate(patch: Partial<Section>) {
    if (extraSelected()?.type === "image" && patch.image !== undefined) setSelectedImage(patch.image);
    else if (extraSelected()?.type === "image" && patch.format?.image) setSelectedPhotoFormat(patch.format.image);
    else update(patch);
  }
  function setSelectedTextFormat(patch: TextFormat) {
    const extra = extraSelected();
    if (extra) update({ elements: selected.elements?.map(e => e.id === extra.id ? { ...e, format: { ...e.format, ...patch } } : e) });
    else applyTextStyle(patch);
  }
  function copySelection(announce = true) {
    if (!selected) return false;
    if (activeTargets.length > 1) {
      const parent = documentRef.current?.querySelector<HTMLElement>(`[data-section="${selected.id}"]`); if (!parent) return false;
      const rect = parent.getBoundingClientRect(), ratio = zoom/100; const metrics: Record<string, import("@/lib/canvas-operations").ElementMetric> = {};
      for (const target of activeTargets) { const node = parent.querySelector<HTMLElement>(`[data-element="${target}"]`); if (node) metrics[target] = measureElement(node,rect,ratio); }
      const result = duplicateTargets(selected,activeTargets,metrics,40);
      clipboard.current = {kind:"elements",elements:result.section.elements?.filter(e => result.targets.includes(`extra:${e.id}`)) || []};
      if (announce) setShortcutNotice("선택한 여러 요소를 복사했어요."); return true;
    }
    if (elementTarget === "section") clipboard.current = { kind: "section", section: structuredClone(selected) };
    else {
      const extra = extraSelected();
      if (extra) clipboard.current = { kind: "element", element: structuredClone({ ...extra, format: extra.format ? { ...extra.format, hidden: false } : undefined, photoFormat: extra.photoFormat ? { ...extra.photoFormat, hidden: false } : undefined }) };
      else if (elementTarget === "image") { if (!selected.image) { setShortcutNotice("복사할 사진이 없어요."); return false; } clipboard.current = { kind: "element", element: { type: "image", image: selected.image, text: "복사한 사진", photoFormat: { ...selected.format?.image, hidden: false } } }; }
      else clipboard.current = { kind: "element", element: { type: "text", text: elementText(selected, elementTarget), format: { ...textFormat(), hidden: false } } };
    }
    if (announce) setShortcutNotice("선택 항목을 복사했어요. Ctrl+V로 붙여넣으세요."); return true;
  }
  function pasteSelection() {
    const content = clipboard.current; if (!content || !selected) return;
    if (content.kind === "elements") {
      if ((selected.elements?.length || 0) + content.elements.length > 20) { setShortcutNotice("추가 요소는 20개까지 넣을 수 있어요."); return; }
      const groupId = crypto.randomUUID(); const elements = content.elements.map(e => ({...structuredClone(e),id:crypto.randomUUID(),x:(e.x || 0)+16,y:(e.y || 0)+16,format:e.format ? {...e.format,groupId} : undefined,photoFormat:e.photoFormat ? {...e.photoFormat,groupId} : undefined}));
      update({elements:[...(selected.elements || []),...elements]}); setSelectionTargets(elements.map(e => `extra:${e.id}`)); setElementTarget(`extra:${elements.at(-1)?.id}`); return;
    }
    if (content.kind === "section") {
      if (project.sections.length >= 30) { setShortcutNotice("페이지는 최대 30개까지 만들 수 있어요."); return; }
      const section = { ...structuredClone(content.section), id: crypto.randomUUID(), reviewed: false, elements: content.section.elements?.map(e => ({ ...structuredClone(e), id: crypto.randomUUID() })) };
      const sections = [...project.sections]; sections.splice(selectedIndex + 1, 0, section); commit({ ...project, sections }); onSelect(section.id); setElementTarget("section"); setTool("pages");
    } else { if ((selected.elements?.length || 0) >= 20) { setShortcutNotice("추가 요소는 페이지당 최대 20개까지 넣을 수 있어요."); return; } addElement(structuredClone(content.element)); }
    setShortcutNotice("선택한 페이지에 붙여넣었어요.");
  }
  function removeSelection() {
    if (!selected) return false;
    if (activeTargets.length && activeTargets.every(t => targetFormat(selected,t).locked)) return false;
    if (activeTargets.length > 1) {
      let section = selected;
      for (const target of activeTargets) { if (targetFormat(section,target).locked) continue; section = target.startsWith("extra:") ? {...section,elements:section.elements?.filter(e => `extra:${e.id}` !== target)} : setTargetFormat(section,target,{hidden:true}); }
      commit({...project,sections:project.sections.map(s => s.id === selected.id ? section : s)}); setSelectionTargets([]); setElementTarget("section"); return true;
    }
    if (elementTarget === "section") { const result = remove(); if (!result) setShortcutNotice("표시할 페이지가 하나 이상 필요해요."); return result; }
    if (elementTarget.startsWith("extra:")) { deleteElement(); return true; }
    if (photoSelected()) setSelectedPhotoFormat({ hidden: true });
    else if (textSelected()) setSelectedTextFormat({ hidden: true });
    return true;
  }
  function orderSelection(mode: "up" | "down" | "first" | "last") {
    if (elementTarget === "section") {
      const destination = mode === "first" ? 0 : mode === "last" ? project.sections.length - 1 : selectedIndex + (mode === "up" ? -1 : 1);
      if (destination < 0 || destination >= project.sections.length) return;
      const sections = [...project.sections], [item] = sections.splice(selectedIndex, 1); sections.splice(destination, 0, item); commit({ ...project, sections });
    } else if (extraSelected()) {
      const elements = [...(selected.elements || [])], index = elements.findIndex(e => `extra:${e.id}` === elementTarget);
      const destination = mode === "first" ? 0 : mode === "last" ? elements.length - 1 : index + (mode === "up" ? -1 : 1);
      if (destination < 0 || destination >= elements.length) return;
      const [item] = elements.splice(index, 1); elements.splice(destination, 0, item); update({ elements });
    } else setShortcutNotice("순서를 바꾸려면 추가 요소나 페이지를 선택해주세요.");
  }
  function fitCanvas() { const width = viewportRef.current?.clientWidth || 650; setZoom(Math.max(25, Math.min(100, Math.floor((width - 125) / 860 * 20) * 5))); }
  function batchFormat(patch: TextFormat & PhotoFormat) {
    const section = activeTargets.reduce((next, target) => setTargetFormat(next, target, patch), selected);
    commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) });
  }
  function groupSelection(ungroup = false) { if (!ungroup && activeTargets.length < 2) return; batchFormat({ groupId: ungroup ? undefined : crypto.randomUUID() }); }
  function alignImage(axis: "left" | "center" | "right") {
    const parent = documentRef.current?.querySelector<HTMLElement>(`[data-section="${selected.id}"]`);
    const image = parent?.querySelector<HTMLElement>(`[data-element="${elementTarget}"]`);
    if (!parent || !image) return;
    const pageRect = parent.getBoundingClientRect(), imageRect = image.getBoundingClientRect();
    const left = axis === "left" ? pageRect.left : axis === "right" ? pageRect.right - imageRect.width : pageRect.left + (pageRect.width - imageRect.width) / 2;
    const section = moveTargets(selected, [elementTarget], (left - imageRect.left) / (zoom / 100), 0);
    commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) });
  }
  function alignSelection(axis: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distribute") {
    const parent = documentRef.current?.querySelector(`[data-section="${selected.id}"]`); if (!parent) return;
    const items = activeTargets.map(target => ({ target, rect: parent.querySelector<HTMLElement>(`[data-element="${target}"]`)?.getBoundingClientRect() })).filter((x): x is { target: string; rect: DOMRect } => Boolean(x.rect)); if (items.length < 2) return;
    const left = Math.min(...items.map(x => x.rect.left)), right = Math.max(...items.map(x => x.rect.right)), top = Math.min(...items.map(x => x.rect.top)), bottom = Math.max(...items.map(x => x.rect.bottom));
    let section = selected;
    if (axis === "distribute") items.sort((a,b) => a.rect.left - b.rect.left);
    const gap = (right - left - items.reduce((n,x) => n + x.rect.width,0)) / (items.length - 1); let cursor = left;
    for (const { target, rect } of items) {
      const dx = axis === "left" ? left-rect.left : axis === "center" ? (left+right-rect.width)/2-rect.left : axis === "right" ? right-rect.right : axis === "distribute" ? cursor-rect.left : 0;
      const dy = axis === "top" ? top-rect.top : axis === "middle" ? (top+bottom-rect.height)/2-rect.top : axis === "bottom" ? bottom-rect.bottom : 0;
      section = moveTargets(section,[target],dx/(zoom/100),dy/(zoom/100)); cursor += rect.width + gap;
    }
    commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) });
  }
  function handleShortcut(action: ShortcutAction, step = 1) {
    if (!selected) return;
    if (action === "group" || action === "ungroup") { groupSelection(action === "ungroup"); return; }
    if (action === "lock" || action === "unlock") { batchFormat({ locked: action === "lock" }); return; }
    if (action === "help") { setShortcutsOpen(true); return; }
    if (action === "save") { onSave(); setShortcutNotice("변경사항을 저장하고 있어요."); return; }
    if (action === "export") { onExport(); return; }
    if (action === "undo") { undo(); setShortcutNotice(history.past.length ? "이전 작업으로 돌아갔어요." : "실행 취소할 작업이 없어요."); return; }
    if (action === "redo") { redo(); setShortcutNotice(history.future.length ? "작업을 다시 실행했어요." : "다시 실행할 작업이 없어요."); return; }
    if (action === "copy") { copySelection(); return; }
    if (action === "paste") { pasteSelection(); return; }
    if (action === "cut") { if (copySelection(false) && removeSelection()) setShortcutNotice("잘라냈어요. Ctrl+V로 다시 붙여넣을 수 있어요."); return; }
    if (action === "duplicate") {
      if (elementTarget === "section") { if (!duplicate()) setShortcutNotice("페이지는 최대 30개까지 만들 수 있어요."); }
      else duplicateElement(); return;
    }
    if (action === "delete") { if (removeSelection()) setShortcutNotice(elementTarget.startsWith("extra:") || elementTarget === "section" ? "선택 항목을 삭제했어요." : "기본 요소를 숨겼어요. 레이어에서 다시 표시할 수 있어요."); return; }
    if (action === "deselect") { setElementTarget("section"); setTool("pages"); setMobilePages(false); return; }
    if (action === "zoomIn" || action === "zoomOut") { setZoom(value => Math.max(25, Math.min(100, value + (action === "zoomIn" ? 5 : -5)))); return; }
    if (action === "fit") { fitCanvas(); return; }
    if (action === "actual") { setZoom(100); return; }
    if (["up", "down", "first", "last"].includes(action)) { orderSelection(action as "up" | "down" | "first" | "last"); return; }
    if (action.startsWith("tool")) { const next = ({ toolPages: "pages", toolText: "text", toolPhotos: "photos", toolLayout: "layout", toolElements: "elements", toolLayers: "layers", toolColor: "color" } as Record<string, Tool>)[action]; if (next) chooseTool(next); return; }
    if (action === "hide") {
      if (elementTarget === "section") toggle();
      else if (photoSelected()) setSelectedPhotoFormat({ hidden: !currentPhotoFormat().hidden });
      else setSelectedTextFormat({ hidden: !textFormat().hidden }); return;
    }
    if (action === "copyStyle") {
      if (elementTarget === "section") styleClipboard.current = { kind: "section", format: structuredClone(selected.format || {}) };
      else if (photoSelected()) { const format = { ...currentPhotoFormat() }; delete format.hidden; delete format.offsetX; delete format.offsetY; styleClipboard.current = { kind: "photo", format }; }
      else { const format = { ...textFormat() }; delete format.hidden; delete format.offsetX; delete format.offsetY; styleClipboard.current = { kind: "text", format }; }
      setShortcutNotice("서식을 복사했어요."); return;
    }
    if (action === "pasteStyle") {
      const style = styleClipboard.current;
      if (style?.kind === "section" && elementTarget === "section") update({ format: structuredClone(style.format) });
      else if (style?.kind === "photo" && photoSelected()) setSelectedPhotoFormat(style.format);
      else if (style?.kind === "text" && textSelected()) setSelectedTextFormat(style.format);
      else { setShortcutNotice("같은 종류의 요소를 선택하고 서식을 복사해주세요."); return; }
      setShortcutNotice("복사한 서식을 적용했어요."); return;
    }
    if (action.startsWith("nudge")) {
      if (elementTarget === "section") { const delta = action === "nudgeUp" || action === "nudgeLeft" ? -1 : 1; const section = project.sections[selectedIndex + delta]; if (section) select(section.id, true); return; }
      const section = moveTargets(selected, activeTargets, action === "nudgeLeft" ? -step : action === "nudgeRight" ? step : 0, action === "nudgeUp" ? -step : action === "nudgeDown" ? step : 0);
      commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) }); return;
    }
    if (!textSelected()) { setShortcutNotice("글자 서식을 바꾸려면 텍스트를 선택해주세요."); return; }
    const format = textFormat();
    if (action === "bold") setSelectedTextFormat({ weight: (format.weight || 400) >= 700 ? 400 : 700 });
    else if (action === "italic") setSelectedTextFormat({ italic: !format.italic });
    else if (action === "underline") setSelectedTextFormat({ underline: !format.underline });
    else if (action === "left" || action === "center" || action === "right") setSelectedTextFormat({ align: action });
    else if (action === "fontLarger" || action === "fontSmaller") setSelectedTextFormat({ fontSize: Math.max(10, Math.min(120, (format.fontSize || 22) + (action === "fontLarger" ? 2 : -2))) });
  }
  useEditorShortcuts(handleShortcut, () => clipboard.current !== null, (files, text) => {
    if (files.length) { onPasteImage(files, photoSelected() ? elementTarget : "image"); setShortcutNotice("붙여넣은 사진을 업로드하고 있어요."); }
    else if (text.trim()) addElement({ type: "text", text: text.slice(0, 3000), format: { fontSize: 22, color: "#555555" } });
  });
  function commandMetrics(request:string):EditorMetrics{
    const metrics:EditorMetrics={},ids=editSectionIds(trackedProject.current,request,selected.id);
    for(const section of documentRef.current?.querySelectorAll<HTMLElement>("[data-section]") || []){
      const id=section.dataset.section!;if(!ids.has(id))continue;metrics[id]={};
      const parent=getComputedStyle(section),containerWidth=Math.min(860,section.clientWidth-parseFloat(parent.paddingLeft)-parseFloat(parent.paddingRight));
      for(const node of Array.from(section.querySelectorAll<HTMLElement>("[data-element]")).slice(0,24)){
        const css=getComputedStyle(node),rect=node.getBoundingClientRect(),width=parseFloat(css.width)||rect.width/(zoom/100),height=parseFloat(css.height)||rect.height/(zoom/100);
        if(width>0&&height>0)metrics[id][node.dataset.element!]={width,height,fontSize:parseFloat(css.fontSize),containerWidth};
      }
    }
    return metrics;
  }
  async function submitCommand(value = command, attachments:AssistantAttachment[] = []) {
    if (!selected || !value.trim() || requestLock.current) return;
    const request = value.trim(); let response = ""; let success = true; let usedAttachments = false;
    requestLock.current = true; setAssistantBusy(true); setCommand(""); setPanel("assistant");
    try {
      const metrics=commandMetrics(request);
      const localEdit=applyLocalEditorRequest(project,request,{sectionId:selected.id,target:elementTarget,targets:activeTargets,metrics});
      if (!localEdit && /이미지|사진|컷/.test(request) && /생성|만들|연출/.test(request)) { await onGenerateImages({sectionId:/전체/.test(request) ? undefined : selected.id,scene:/수확/.test(request)?"harvest":/선별|포장/.test(request)?"sorting":/모델|인물/.test(request)?"lifestyle":/산지|농장|재배/.test(request)?"farm":/접사|디테일/.test(request)?"detail":undefined,prompt:request,attachments});setMessages(current=>[...current,{id:Date.now(),request,response:"사진 생성 진행 상태를 확인해주세요.",success:true}]);return; }

      const instruction = parseInstruction(request);
      if (localEdit) { commit(localEdit.project); response = localEdit.summary; }
      else if (request === "공백 정리") { update({title:cleanCopy(selected.title),body:cleanCopy(selected.body)}); response = "공백을 정리했어요."; }
      else if (request === "위로" || request === "아래로") { move(request === "위로" ? -1 : 1); response = "페이지 순서를 변경했어요."; }
      else if (instruction?.type === "text") {
        const key = instruction.target || (elementTarget === "kicker" ? "kicker" : elementTarget === "body" ? "body" : "title");
        update({ [key]: instruction.text.slice(0, key === "body" ? 5000 : key === "kicker" ? 200 : 150) }); response = "입력한 문구를 바로 적용했어요.";
      } else if (instruction?.type === "format" || instruction?.type === "photo") {
        const targets = /사진|이미지/.test(request) ? ["image"] : /제목/.test(request) ? ["title"] : activeTargets.length ? activeTargets : [instruction.type === "photo" ? "image" : "title"];
        const section = targets.reduce((next, target) => setTargetFormat(next, target, instruction.format), selected);
        commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) }); response = "요청한 서식을 적용했어요.";
      } else if (instruction?.type === "move") {
        const section = moveTargets(selected, /사진|이미지/.test(request) ? ["image"] : /제목/.test(request) ? ["title"] : activeTargets.length ? activeTargets : ["title"], instruction.x, instruction.y);
        commit({ ...project, sections: project.sections.map(s => s.id === selected.id ? section : s) }); response = "선택한 요소를 이동했어요.";
      } else if (instruction?.type === "action") {
        if (instruction.action === "hide" || instruction.action === "show") { const hidden = instruction.action === "hide"; if (elementTarget === "section") { if (!hidden || visible.length > 1) update({ visible: !hidden }); } else batchFormat({ hidden }); }
        else handleShortcut(instruction.action); response = "요청한 편집을 적용했어요.";
      } else {
        const snapshot = trackedProject.current; const all = /전체|모든|모두/.test(request);
        const result = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: snapshot, request, all, sectionId: selected.id, target:elementTarget, targets:activeTargets,attachments,metrics }) });
        const data = await result.json(); if (!result.ok) throw new Error(data.error || "문구 작성에 실패했어요. 연결 설정을 확인해주세요.");
        const latest = trackedProject.current;
        if(data.project){
          if(data.project.id!==snapshot.id || JSON.stringify(latest)!==JSON.stringify(snapshot))throw new Error("요청 중 작업이 변경되어 AI 적용을 멈췄어요. 다시 요청해주세요.");
          commit(data.project);if(!data.project.sections.some((s:Section)=>s.id===selectedId))onSelect(data.project.sections[0].id);
        }else{
          const ids = new Set((data.sections as Section[]).map(s => s.id));
          if (latest.sections.some(s => ids.has(s.id) && JSON.stringify([s.title,s.body,s.kicker]) !== JSON.stringify((() => { const old = snapshot.sections.find(x => x.id === s.id); return [old?.title,old?.body,old?.kicker]; })()))) throw new Error("작성 중 문구가 변경되어 적용을 멈췄어요. 다시 요청해주세요.");
          commit({ ...latest, copyReport: data.report, sections: latest.sections.map(s => { const generated = (data.sections as Section[]).find(x => x.id === s.id); return generated ? { ...s, ...generated, reviewed: false } : s; }) });
        }
        usedAttachments = Boolean(data.attachmentsUsed);
        response = data.editSummary || (data.mode !== "local" ? data.report.summary : "상품 정보와 입력 리뷰를 반영한 기본 문구를 적용했어요. 자유로운 AI 작성은 AI 설정에서 키를 연결해주세요.");
      }
    } catch (error) { success = false; response = error instanceof Error ? error.message : "문구 작성에 실패했어요. 연결 설정을 확인해주세요."; }
    finally { requestLock.current = false; setAssistantBusy(false); }
    if(success && attachments.length && !usedAttachments)response += " \uCCA8\uBD80\uD30C\uC77C\uC740 \uB2E4\uC74C \uC694\uCCAD\uC5D0 \uC0AC\uC6A9\uD560 \uC218 \uC788\uB3C4\uB85D \uC720\uC9C0\uD588\uC5B4\uC694.";
    setMessages(current => [...current, { id: Date.now(), request, response, success }].slice(-15));
    return success && (!attachments.length || usedAttachments);
  }
  const title = tools.find(t => t.id === tool)?.label || "텍스트";

  return <div className="outline-studio">
    <nav className="os-tool-rail" aria-label="구성안 편집 도구">{tools.map(({ id, label, icon: Icon }) => <button key={id} className={tool === id ? "selected" : ""} aria-pressed={tool === id} aria-label={`${label} 도구`} onClick={() => chooseTool(id)}><Icon size={18} strokeWidth={1.6} /><span>{label}</span></button>)}<button className="os-help" onClick={onHelp}><CircleHelp size={17} /><span>도움말</span></button></nav>
    {mobilePages && <button className="os-page-scrim" aria-label="페이지 목록 닫기" onClick={() => setMobilePages(false)} />}
    <aside className={`os-pages ${mobilePages ? "mobile-open" : ""}`}>{tool !== "pages" && selected ? <EditorToolLibrary onApplySkin={applySkin} onLayerSelect={selectLayer} onLayerAction={changeLayer} onAlignImage={alignImage} imageGenerating={imageGenerating} onGenerateImage={request=>void onGenerateImages(request)} tool={tool} section={selected} project={project} target={elementTarget} onPages={() => { setTool("pages"); setElementTarget("section"); }} onTarget={target => target === "image" && extraSelected()?.type === "image" ? targetElement(elementTarget) : targetElement(target)} onAddElement={addElement} onTextStyle={applyTextStyle} onUpdate={libraryUpdate} onTheme={theme => commit({ ...project, product: { ...project.product, theme } })} onUpload={() => onUpload(elementTarget)} uploading={uploading} onEditBrief={onEditBrief} /> : <><button className="os-back" onClick={onBack}><ArrowLeft size={12} />내 작업 내역<ChevronRight size={11} /></button><div className="os-pages-heading"><span>총 <strong>{project.sections.length}</strong> 페이지</span><small>860 × {pageHeight ? pageHeight.toLocaleString() : "—"} px</small></div><label className="os-page-search"><Search size={12} /><input aria-label="페이지 검색" placeholder="페이지 검색" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="os-page-list">{project.sections.filter(s => `${s.title} ${sectionNames[s.kind]}`.includes(search)).map(section => <div className={`os-page-item ${section.id === selected?.id ? "selected" : ""} ${!section.visible ? "is-hidden" : ""}`} key={section.id} draggable onDragStart={e => { dragged.current = section.id; e.dataTransfer.setData("text/plain", section.id); e.dataTransfer.effectAllowed = "move"; }} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} onDrop={e => { e.preventDefault(); reorder(dragged.current || e.dataTransfer.getData("text/plain"), section.id); dragged.current = ""; }}><span className="os-drag"><GripVertical size={13} /></span><button onClick={() => select(section.id, true)} aria-label={`${project.sections.indexOf(section) + 1}페이지 ${sectionNames[section.kind]} ${section.title}`}><span className="os-page-thumb" aria-hidden="true"><span><DetailPage project={{ ...project, sections: [section] }} /></span></span><span className="os-page-copy"><small>{String(project.sections.indexOf(section) + 1).padStart(2, "0")} · {sectionNames[section.kind]}</small><strong>{section.title || "제목 없는 페이지"}</strong><span>{!section.visible ? "숨김" : section.body || "본문을 입력해주세요"}</span></span></button></div>)}</div><button className="os-add-page" disabled={project.sections.length >= 30} onClick={onAdd}><Plus size={13} />페이지 추가<span>{project.sections.length}/30</span></button></>}</aside>

    <section className="os-workspace"><div className="os-workspace-toolbar"><span className="os-stage-label"><Layers3 size={13} />구성안 편집</span><span className="os-toolbar-divider" /><button aria-label="편집 실행 취소" title="실행 취소 (Ctrl+Z)" disabled={!history.past.length} onClick={undo}><Undo2 size={14} /></button><button aria-label="편집 다시 실행" title="다시 실행 (Ctrl+Y)" disabled={!history.future.length} onClick={redo}><Redo2 size={14} /></button><span className="os-toolbar-caption">클릭해서 페이지를 선택하세요</span><button className="os-shortcut-button" aria-label="편집 단축키 안내" title="단축키 (? / Ctrl+/)" onClick={() => setShortcutsOpen(true)}><Keyboard size={14} /><span>단축키</span></button><button className="os-image-create" disabled={imageGenerating} onClick={()=>void onGenerateImages()}><Sparkles size={13}/>산지·모델컷 생성</button><button className="os-review-top" onClick={onReview}><ListChecks size={13} />문구 검수<ArrowRight size={12} /></button></div>{selected && <div className="os-element-toolbar">{elementTarget === "section" ? <span>클릭으로 선택 · 더블클릭으로 글 수정</span> : <><span>{elementTarget === "image" ? "사진 선택" : "텍스트 · 요소 선택"}</span>{activeTargets.length > 1 && <><span>{activeTargets.length} selected</span>{(["left","center","right","top","middle","bottom","distribute"] as const).map(axis => <button key={axis} onClick={() => alignSelection(axis)}>{({left:"좌",center:"가로 중앙",right:"우",top:"위",middle:"세로 중앙",bottom:"아래",distribute:"간격"})[axis]}</button>)}<button onClick={() => groupSelection()}>그룹</button><button onClick={() => groupSelection(true)}>해제</button></>}<button onClick={() => batchFormat({locked: !activeTargets.every(t => targetFormat(selected,t).locked)})}>잠금</button>{elementTarget !== "image" && <><button onClick={() => applyTextStyle({ weight: 700 })}>B</button><button onClick={() => applyTextStyle({ align: "left" })}>왼쪽</button><button onClick={() => applyTextStyle({ align: "center" })}>가운데</button></>}<button onClick={() => setPanel("edit")}><Settings2 size={12} />속성</button><button onClick={clearElementSelection}><X size={12} />선택 해제</button></>}</div>}<div className={`os-viewport ${transform.dragging ? "is-transforming" : ""}`} ref={viewportRef} onClick={event => {
      if (transform.suppressClick.current || transform.dragging || !(event.target instanceof Element)) return;
      if (event.target.closest('[data-section],button,input,textarea,select,a,.canvas-selection,.canvas-inline-editor')) return;
      clearElementSelection();
    }}><div className="os-document-row"><div className="os-document-column" style={{ width: 860 * zoom / 100 }}><div className="os-document-label"><span>{project.product.name}</span><span>{visible.length}개 표시</span></div><div className="os-document-frame"><div className="os-document-scale" ref={documentRef} style={{ zoom: zoom / 100 }}><DetailPage onDeletePage={id=>{deleteCanvasPage(id);}} onInsertPage={insertCanvasPage} onResizePage={(id,height)=>commit(resizePage(trackedProject.current,id,height))} project={transform.preview || project} selected={selected?.id} selectedElement={elementTarget} selectedElements={activeTargets} onSelectElement={selectElement} onEditText={startInline} onSelect={id => select(id)} /></div></div></div><div className="os-floating-tools" aria-label="선택한 페이지 작업"><span>{selectedIndex + 1}</span><button aria-label="선택 페이지 위로" title="위로 이동" disabled={selectedIndex === 0} onClick={() => move(-1)}><ArrowUp size={14} /></button><button aria-label="선택 페이지 아래로" title="아래로 이동" disabled={selectedIndex === project.sections.length - 1} onClick={() => move(1)}><ArrowDown size={14} /></button><i /><button aria-label="선택 페이지 복제" title="페이지 복제" disabled={project.sections.length >= 30} onClick={duplicate}><Copy size={14} /></button><button aria-label="선택 페이지 숨김 전환" title={selected?.visible ? "페이지 숨기기" : "페이지 표시하기"} disabled={selected?.visible && visible.length === 1} onClick={toggle}>{selected?.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button><button aria-label="선택 페이지 삭제" title="페이지 삭제" disabled={selected?.visible && visible.length === 1} onClick={remove}><Trash2 size={14} /></button></div></div>{inlineEditing && <InlineTextEditor key={`${inlineEditing.sectionId}:${inlineEditing.target}`} editing={inlineEditing} onCommit={finishInline} onCancel={()=>setInlineEditing(null)}/>}{!inlineEditing && transform.box && <div className="canvas-selection" style={transform.box}>{["nw","n","ne","e","se","s","sw","w"].map(corner => <button key={corner} className={`resize-${corner}`} data-resize={corner} aria-label={`Resize ${corner}`} />)}</div>}</div>{shortcutNotice && <div className="os-shortcut-status" role="status">{shortcutNotice}</div>}<div className="os-zoom"><button aria-label="구성안 축소" onClick={() => setZoom(Math.max(25, zoom - 5))}><ZoomOut size={14} /></button><select aria-label="구성안 배율" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => 25 + i * 5).map(value => <option key={value} value={value}>{value}%</option>)}</select><button aria-label="구성안 확대" onClick={() => setZoom(Math.min(100, zoom + 5))}><ZoomIn size={14} /></button></div></section>

    <aside className="os-inspector" ref={propertiesRef}><div className="os-inspector-heading"><Settings2 size={15} /><strong>페이지 편집</strong><span className={`os-save-dot ${saveState}`} /> <small>{saveState === "saved" ? "저장됨" : saveState === "error" ? "저장 실패" : "저장 중"}</small></div><div className="os-inspector-tabs"><button className={panel === "edit" ? "selected" : ""} onClick={() => setPanel("edit")}><Settings2 size={12} />편집</button><button className={panel === "assistant" ? "selected" : ""} onClick={() => setPanel("assistant")}><MessageSquareText size={12} />수정 도우미</button></div><div className="os-inspector-scroll">{elementNotice && <p className="os-element-notice" role="status">{elementNotice}</p>}{selected && <div className="os-selected-context"><span className="section-kind">{sectionNames[selected.kind]}</span><span>{selectedIndex + 1}페이지에 적용</span><p>{selected.title || "제목 없는 페이지"}</p></div>}
      {panel === "assistant" ? <div className="os-conversation"><div className="os-assistant-intro"><Sparkles size={17} /><strong>선택한 페이지를 빠르게 수정해요.</strong><p>정해진 명령으로 제목·본문·순서를 바꿀 수 있어요.</p><div><button onClick={() => setCommand("제목: ")}>제목 바꾸기</button><button onClick={() => setCommand("공백 정리")}>공백 정리</button><button onClick={() => setCommand("복제")}>페이지 복제</button></div></div>{messages.map(message => <div className="os-message-pair" key={message.id}><p className="os-user-message">{message.request}</p><div className={`os-reply ${message.success ? "success" : ""}`}><span>{message.success ? <Check size={12} /> : <CircleHelp size={12} />}{message.success ? "수정 완료" : "명령 확인"}</span><p>{message.response}</p></div></div>)}</div> : <div className="os-property-content"><div className="os-property-title"><strong>{title === "페이지" ? "페이지 구성" : title}</strong><small>선택한 페이지에 바로 반영돼요</small></div>
        {selected && ["text", "pages", "photos", "layout", "elements", "layers", "color"].includes(tool) && <ElementProperties section={selected} target={elementTarget} onUpdate={update} onTarget={targetElement} onDuplicate={duplicateElement} onDelete={deleteElement} />}
        {tool === "photos" && selected && <><p className="os-tool-description">상품 사진을 골라 선택한 페이지에 넣어보세요.</p><button className="os-upload-button" disabled={uploading || project.product.images.length >= 10} onClick={() => onUpload(elementTarget)}><Upload size={14} />{uploading ? "사진을 올리고 있어요…" : "새 사진 업로드"}<small>{project.product.images.length}/10</small></button><div className="os-photo-grid"><button className={!selected.image ? "selected empty" : "empty"} aria-label="구성안 이미지 제거" onClick={() => setSelectedImage("")}><EyeOff size={21} /><span>사진 없음</span></button>{project.product.images.map((url, i) => <button key={`${url}-${i}`} aria-label={`구성안 사진 ${i + 1} 선택`} className={url === selected.image ? "selected" : ""} onClick={() => setSelectedImage(url)}><img src={url} alt={`상품 사진 ${i + 1}`} />{url === selected.image && <span><Check size={11} /></span>}</button>)}</div><p className="os-tool-footnote">JPG · PNG · WebP · AVIF<br />장당 8MB 이하, 상품 사진 최대 10장</p></>}
        {tool === "reference" && <><p className="os-tool-description">기획안과 참고 이미지를 보며 페이지를 다듬어보세요.</p><button className="os-property-button" onClick={onEditBrief}><FileText size={13} />기획안 · 참고 자료 수정<ArrowRight size={12} /></button><div className="os-brief-preview">{project.product.design?.brief || "등록된 디자인 기획안이 없어요."}</div><div className="os-reference-grid">{project.product.design?.references.map((url, i) => <a href={url} target="_blank" rel="noreferrer" key={`${url}-${i}`}><img src={url} alt={`레퍼런스 ${i + 1}`} /><span>참고 {i + 1}</span></a>)}</div>{!project.product.design?.references.length && <p className="os-tool-footnote">기획안에서 레퍼런스 이미지를 추가할 수 있어요.</p>}</>}
        {tool === "layout" && selected && <><label className="os-field"><span>페이지 유형</span><select aria-label="선택 페이지 유형" value={selected.kind} onChange={e => update({ kind: e.target.value as Section["kind"],canvasMode:undefined })}>{Object.entries(sectionNames).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label><div className="os-layout-choices"><span>전체 페이지 구성</span>{(["editorial", "minimal"] as const).map(layout => <button key={layout} className={(project.product.design?.layout || "editorial") === layout ? "selected" : ""} onClick={() => commit({ ...project, product: { ...project.product, design: { ...structuredClone(emptyDesignBrief), ...project.product.design, layout } } })}><LayoutTemplate size={17} /><span>{layout === "editorial" ? "스토리가 있는 구성" : "간결한 구성"}<small>{layout === "editorial" ? "큰 사진과 여유 있는 흐름" : "정돈된 여백과 핵심 정보"}</small></span>{(project.product.design?.layout || "editorial") === layout && <Check size={12} />}</button>)}</div><button className="os-property-button" onClick={onAdd} disabled={project.sections.length >= 30}><Plus size={13} />페이지 추가</button></>}
        {tool === "color" && <><p className="os-tool-description">전체 상세페이지에 적용할 테마를 골라보세요.</p><div className="os-theme-list">{Object.entries(themes).map(([key, theme]) => <button key={key} className={project.product.theme === key ? "selected" : ""} onClick={() => commit({ ...project, product: { ...project.product, theme: key as StudioProject["product"]["theme"] } })}><span style={{ background: theme.light }}><i style={{ background: theme.accent }} /><i style={{ background: theme.accent, opacity: .35 }} /></span><strong>{theme.name}</strong>{project.product.theme === key && <Check size={12} />}</button>)}</div></>}
        {selected && <div className="os-section-actions"><button disabled={selected.visible && visible.length === 1} onClick={toggle}>{selected.visible ? <EyeOff size={13} /> : <Eye size={13} />}{selected.visible ? "완성본에서 숨기기" : "완성본에 표시하기"}</button><button disabled={project.sections.length >= 30} onClick={duplicate}><Copy size={13} />복제</button></div>}
      </div>}
    </div><CommandComposer canHook={["title","body","kicker"].includes(elementTarget)||["text","badge"].includes(extraSelected()?.type || "")} value={command} onChange={setCommand} onSend={(text,attachments) => submitCommand(text,attachments)} busy={assistantBusy} selectedLabel={`${selectedIndex + 1}페이지 · ${({title:"제목",body:"본문",kicker:"서브",image:"사진",section:"페이지"} as Record<string,string>)[elementTarget] || "선택 요소"}`}  onSettings={onAISettings} /><div className="os-inspector-footer"><button onClick={onReview}><ListChecks size={14} />다음: 문구 검수<ArrowRight size={13} /></button></div></aside>
    {shortcutsOpen && <ShortcutGuide onClose={() => setShortcutsOpen(false)} />}
  </div>;
}
