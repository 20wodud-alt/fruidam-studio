"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Eye, Palette, Sparkles, X } from "lucide-react";
import { applyDesignSkin, designSkins, type DesignSkin, type SkinId, type SkinScope } from "@/lib/design-skins";
import type { StudioProject } from "@/lib/studio";
import { DetailPage } from "./detail-page";

type Props = { project: StudioProject; sectionId: string; onApply: (id: SkinId, scope: SkinScope) => void };
export function DesignSkinGallery({ project, sectionId, onApply }: Props) {
  const [category, setCategory] = useState("all");
  const [preview, setPreview] = useState<DesignSkin | null>(null);
  const current = project.sections.find(section => section.id === sectionId)?.format?.skin;
  const samples = useMemo(() => {
    const sections = project.sections.filter(section => section.visible).slice(0, 3);
    const sample = { ...project, sections: sections.length ? sections : project.sections.slice(0, 1).map(section => ({ ...section, visible: true })) };
    return designSkins.map(skin => ({ skin, sample: applyDesignSkin(sample, skin.id, "all", sample.sections[0].id) }));
  }, [project]);
  return <section className="skin-gallery" aria-label="디자인 스킨 갤러리">
    <div className="sg-intro"><span><Palette size={19}/></span><div><strong>상품의 다른 표정</strong><p>내 상품으로 미리 보는 디자인 스킨</p></div></div>
    <div className="sg-tabs" aria-label="스킨 분류">{[["all", "전체"], ["story", "스토리"], ["clean", "정보형"], ["photo", "사진형"]].map(([key, label]) => <button key={key} className={category === key ? "active" : ""} aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}</div>
    <div className="sg-grid">{samples.filter(({ skin }) => category === "all" || skin.category === category).map(({ skin, sample }, index) => <button className={`sg-card ${current === skin.id ? "is-applied" : ""}`} key={skin.id} aria-label={`${skin.name} 스킨 미리보기`} onClick={() => setPreview(skin)}>
      <span className={`sg-thumb sg-thumb-${skin.id}`}><span className="sg-mini-document" aria-hidden="true"><DetailPage project={sample}/></span><span className="sg-thumb-shade"/>{current === skin.id ? <span className="sg-card-badge"><Check size={10}/>사용 중</span> : index === 0 && <span className="sg-card-badge"><Sparkles size={10}/>추천</span>}<span className="sg-peek"><Eye size={12}/>미리보기</span></span>
      <span className="sg-card-copy"><strong>{skin.name}</strong><small>{skin.description}</small></span>
    </button>)}</div><p className="sg-note">흰 바탕 · 초록 포인트 · 내 글과 사진 유지</p>
    {preview && <SkinPreview project={project} sectionId={sectionId} skin={preview} onClose={() => setPreview(null)} onApply={scope => { onApply(preview.id, scope); setPreview(null); }}/>} 
  </section>;
}

function SkinPreview({ project, sectionId, skin, onClose, onApply }: { project: StudioProject; sectionId: string; skin: DesignSkin; onClose: () => void; onApply: (scope: SkinScope) => void }) {
  const [scope, setScope] = useState<SkinScope>("page");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  const styled = useMemo(() => {
    const next = applyDesignSkin(project, skin.id, scope, sectionId);
    return scope === "page" ? { ...next, sections: next.sections.filter(section => section.id === sectionId).map(section => ({ ...section, visible: true })) } : next;
  }, [project, sectionId, skin.id, scope]);
  return createPortal(<dialog className="skin-dialog" ref={dialog} role="dialog" aria-modal="true" aria-label="디자인 스킨 미리보기" onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="sg-dialog-card"><header><span><Palette size={16}/><strong>디자인 스킨 미리보기</strong></span><button aria-label="스킨 미리보기 닫기" onClick={onClose}><X size={19}/></button></header>
      <div className="sg-dialog-grid"><div className="sg-preview-area"><div className="sg-preview-document"><DetailPage project={styled}/></div></div><aside className="sg-details"><span className="sg-eyebrow">FRUIDAM DESIGN COLLECTION</span><h2>{skin.name}</h2><p>{skin.description}</p><div className="sg-feature-list"><span><Check size={13}/>현재 상품의 문구와 사진 사용</span><span><Check size={13}/>제목·간격·사진 프레임 재정렬</span><span><Check size={13}/>추가 요소·숨김 상태 유지</span><span><Check size={13}/>실행 취소로 이전 디자인 복원</span></div><fieldset><legend>어디에 적용할까요?</legend><label className={scope === "page" ? "is-selected" : ""}><input type="radio" name="design-skin-scope" value="page" checked={scope === "page"} onChange={() => setScope("page")}/><span>현재 페이지<small>선택한 {project.sections.findIndex(section => section.id === sectionId) + 1}페이지에 적용</small></span></label><label className={scope === "all" ? "is-selected" : ""}><input type="radio" name="design-skin-scope" value="all" checked={scope === "all"} onChange={() => setScope("all")}/><span>전체 페이지<small>{project.sections.length}개 페이지에 같은 스킨 적용</small></span></label></fieldset><p className="sg-cost-note">AI 호출 없이 바로 적용돼요.</p><button className="sg-apply" onClick={() => onApply(scope)}><Check size={15}/>{scope === "page" ? "현재 페이지에 적용" : "전체 페이지에 적용"}</button><button className="sg-cancel" onClick={onClose}>닫기</button></aside></div>
    </div>
  </dialog>, document.body);
}
