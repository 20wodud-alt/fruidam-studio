"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ChevronDown, Eye, EyeOff, Image as ImageIcon, Layers3, LockKeyhole, Minus, Search, Shapes, Trash2, Type, UnlockKeyhole } from "lucide-react";
import { projectLayers, type LayerAction } from "@/lib/project-layers";
import { sectionNames, type StudioProject } from "@/lib/studio";

export function ProjectLayerPanel({ project, sectionId, target, onSelect, onAction }: { project: StudioProject; sectionId: string; target: string; onSelect: (id: string, target: string) => void; onAction: (id: string, target: string, action: LayerAction) => void }) {
  const [query, setQuery] = useState("");
  const selection = `${sectionId}:${target}`;
  const [disclosure, setDisclosure] = useState<{ selection: string; pages: Record<string, boolean> }>({ selection, pages: {} });
  const pages = project.sections.map((section, index) => ({ section, index, layers: projectLayers(section) }));
  const total = pages.reduce((count, page) => count + page.layers.length, 0);
  const term = query.trim().toLocaleLowerCase();
  const filtered = pages.map(page => ({ ...page, matched: !term || `${page.section.title} ${sectionNames[page.section.kind]} ${page.index + 1}`.toLocaleLowerCase().includes(term) ? page.layers : page.layers.filter(layer => `${layer.name} ${layer.preview}`.toLocaleLowerCase().includes(term)) })).filter(page => !term || page.matched.length);
  function open(id: string) { return Boolean(term) || (disclosure.selection !== selection && id === sectionId) || (disclosure.pages[id] ?? id === sectionId); }
  function toggle(id: string) { const expanded = open(id); setDisclosure(current => ({ selection, pages: { ...current.pages, [id]: !expanded } })); }
  return <div className="project-layers" aria-label="페이지별 레이어">
    <div className="pl-summary"><span className="pl-summary-icon"><Layers3 size={19}/></span><div><strong>페이지별 레이어</strong><small>{pages.length}개 페이지 · {total}개 요소</small></div></div>
    <label className="pl-search"><Search size={14}/><input aria-label="레이어 검색" placeholder="페이지 또는 요소 검색" value={query} onChange={event => setQuery(event.target.value)}/></label>
    <div className="pl-view-actions"><button onClick={() => setDisclosure({ selection, pages: Object.fromEntries(pages.map(page => [page.section.id, true])) })}>모두 펼치기</button><span>·</span><button onClick={() => setDisclosure({ selection, pages: Object.fromEntries(pages.map(page => [page.section.id, false])) })}>접기</button></div>
    {filtered.map(({ section, index, layers, matched }) => <section key={section.id} className={`pl-page ${sectionId === section.id ? "is-current" : ""} ${section.visible ? "" : "is-page-hidden"}`} aria-label={`${index + 1}페이지 레이어`}>
      <header><button className="pl-disclosure" aria-label={`${index + 1}페이지 레이어 ${open(section.id) ? "접기" : "펼치기"}`} aria-expanded={open(section.id)} onClick={() => toggle(section.id)}><ChevronDown size={14}/></button><button className="pl-page-select" aria-label={`${index + 1}페이지로 이동`} onClick={() => { setDisclosure(current => ({ selection: `${section.id}:section`, pages: { ...current.pages, [section.id]: true } })); onSelect(section.id, "section"); }}><span className="pl-page-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{sectionNames[section.kind]}</strong><small>{section.title.replace(/\s+/g, " ") || "제목 없는 페이지"}</small></span></button><span className="pl-count">{layers.length}</span></header>
      {open(section.id) && <><div className="pl-page-status"><span>{sectionId === section.id ? "현재 페이지" : "페이지 요소"}{!section.visible && " · 페이지 숨김"}</span><button aria-label={`${index + 1}페이지 ${section.visible ? "숨기기" : "표시하기"}`} title={section.visible ? "페이지 숨기기" : "페이지 표시하기"} disabled={section.visible && project.sections.filter(s => s.visible).length === 1} onClick={() => onAction(section.id, "section", "visibility")}>{section.visible ? <Eye size={12}/> : <EyeOff size={12}/>}</button></div><div className="pl-items">{matched.map(layer => {
        const Icon = layer.kind === "image" ? ImageIcon : layer.kind === "badge" ? Shapes : layer.kind === "divider" ? Minus : Type;
        const selected = sectionId === section.id && target === layer.target;
        const label = `${index + 1}페이지 ${layer.name}`;
        return <div key={layer.target} className={`pl-item ${selected ? "is-selected" : ""} ${layer.hidden ? "is-hidden" : ""}`} data-layer-target={layer.target}>
          <button className="pl-layer-select" aria-label={`${label} 선택`} aria-pressed={selected} onClick={() => onSelect(section.id, layer.target)}><span className={`pl-type pl-type-${layer.kind}`}>{layer.image ? <img src={layer.image} alt=""/> : <Icon size={14}/>}</span><span className="pl-layer-copy"><strong>{layer.name}</strong><small>{layer.preview.replace(/\s+/g, " ")}</small></span></button>
          <div className="pl-item-actions"><button aria-label={`${label} ${layer.hidden ? "표시하기" : "숨기기"}`} title={layer.hidden ? "표시하기" : "숨기기"} onClick={() => onAction(section.id, layer.target, "visibility")}>{layer.hidden ? <EyeOff size={13}/> : <Eye size={13}/>}</button><button aria-label={`${label} ${layer.locked ? "잠금 해제" : "잠그기"}`} title={layer.locked ? "잠금 해제" : "잠그기"} aria-pressed={layer.locked} onClick={() => onAction(section.id, layer.target, "lock")}>{layer.locked ? <LockKeyhole size={13}/> : <UnlockKeyhole size={13}/>}</button><button aria-label={`${label} 삭제`} title={layer.locked ? "잠금 해제 후 삭제" : "삭제 · 실행 취소 가능"} disabled={layer.locked} onClick={() => onAction(section.id, layer.target, "delete")}><Trash2 size={13}/></button></div>
        </div>;
      })}{!layers.length && <p className="pl-empty">아직 추가한 요소가 없어요.</p>}</div></>}
    </section>)}
    {!filtered.length && <p className="pl-empty">검색한 페이지나 요소가 없어요.</p>}
  </div>;
}
