"use client";
import { prepareImageUpload } from "@/lib/client-upload";
/* eslint-disable @next/next/no-img-element */
import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, ChevronRight, CircleHelp, Copy, Download, Eye, EyeOff, FilePlus2, FileText, FolderOpen, LayoutTemplate, LoaderCircle, Menu, Plus, Search, Save, Settings2, Sparkles, Star, Trash2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";
import { demoProduct, emptyProduct, generateSections, sectionNames, themes, type Product, type Section, type SectionKind, type StudioProject } from "@/lib/studio";
import { AIConnectionButton, AIConnectionSettings } from "@/components/ai-connection";
import { DetailPage, detailStyles } from "@/components/detail-page";
import { buildImagePlan, imageScenes, type ImageRequest } from "@/lib/image-plan";
import { GenerationLoading } from "@/components/generation-loading";
import type { GenerationEvent, GenerationStage } from "@/lib/generation-progress";
import { ProductCreationForm } from "@/components/product-creation-form";
import { DesignBriefFields } from "@/components/design-brief-fields";
import { CopyReviewPage } from "@/components/copy-review-page";
import { OutlineStudio } from "@/components/outline-studio";
import { emptyDesignBrief } from "@/lib/studio";
import { MarketDownloadOptions } from "@/components/market-download-options";
import { exportStem, marketProfiles, type MarketImageFormat, type MarketPlatform } from "@/lib/market-export";

type Screen = "home" | "form" | "generating" | "outline" | "review" | "editor";
const categories = ["식품 · 농수산물", "패션 · 잡화", "뷰티 · 생활", "가구 · 인테리어", "디지털 · 가전", "기타"];
export default function Studio() {
  const [screen, setScreen] = useState<Screen>("home");
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [draft, setDraft] = useState<StudioProject | null>(null);
  const [generationStages,setGenerationStages]=useState<GenerationStage[]>([]);const [generationError,setGenerationError]=useState("");const generationId=useRef("");
  const [form, setForm] = useState<Product>(structuredClone(emptyProduct));
  const [imageProgress,setImageProgress]=useState<{busy:boolean;done:number;total:number;label:string;error:string}|null>(null);
  const imageLock=useRef(false);const imageStop=useRef(false);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState<"local" | "supabase" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [briefBusy, setBriefBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPlatform, setExportPlatform] = useState<MarketPlatform>("smartstore");
  const [exportImageFormat, setExportImageFormat] = useState<MarketImageFormat>("jpg");
  const [exportProgress, setExportProgress] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [banner, setBanner] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<"help" | "add" | "download" | "product" | "brief" | "ai" | null>(null);
  const [deleteProject, setDeleteProject] = useState<StudioProject | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [zoom, setZoom] = useState(55);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageTarget = useRef<"form" | "section">("form");
  const sectionElementTarget = useRef("image");
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latestDraft = useRef<StudioProject | null>(null);
  const savedSnapshot = useRef("");
  const uploadLock = useRef(false);
  const busyLock = useRef(false);

  async function load() {
    setError("");
    try { const r = await fetch("/api/studio", { cache: "no-store" }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setStorage(r.headers.get("X-Fruidam-Storage") === "supabase" ? "supabase" : "local"); setProjects(data); }
    catch (e) { setError(e instanceof Error ? e.message : "작업을 불러오지 못했어요."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { setModal(null); setDeleteProject(null); setMobileMenu(false); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  useEffect(() => {
    if (screen !== "editor" || !canvasRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      setZoom(Math.max(25, Math.min(55, Math.floor((width - 42) / 860 * 20) * 5)));
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [screen]);
  async function api(payload: object): Promise<StudioProject[]> {
    const r = await fetch("/api/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await r.json(); if (!r.ok) throw new Error(data.error || "저장하지 못했어요."); setStorage(r.headers.get("X-Fruidam-Storage") === "supabase" ? "supabase" : "local"); return data;
  }
  function save(project: StudioProject) {
    setSaveState("saving"); const snapshot = JSON.stringify(project);
    const result = queue.current.catch(() => {}).then(async () => {
      const data = await api({ action: "save", id: project.id, product: project.product, sections: project.sections, copyReport: project.copyReport, copyAudit: project.copyAudit }); setProjects(data);
      if (JSON.stringify(latestDraft.current) === snapshot) { savedSnapshot.current = snapshot; setSaveState("saved"); }
      return data;
    });
    queue.current = result;
    return result.catch(e => { setSaveState("error"); setError(e instanceof Error ? e.message : "저장하지 못했어요."); throw e; });
  }
  useEffect(() => {
    if (!draft || JSON.stringify(draft) === savedSnapshot.current) return;
    const timer = setTimeout(() => { void save(draft).catch(() => {}); }, 650);
    return () => clearTimeout(timer);
    // Schedule persistence when the document changes, not on save status changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);
  function changeDraft(next: StudioProject) {
    const previous = latestDraft.current;
    if (previous?.id === next.id && (previous.product.name !== next.product.name || previous.product.price !== next.product.price)) next = { ...next, sections: next.sections.map(s => ({ ...s, reviewed: false })) };
    latestDraft.current = next; setDraft(next); setSaveState("saving");
  }
  function changeSection(patch: Partial<Section>) { if(patch.image!==undefined && !("imageMeta" in patch))patch={...patch,imageMeta:undefined}; if (draft) changeDraft({ ...draft, sections: draft.sections.map(s => s.id === selectedId ? { ...s, ...patch, ...("title" in patch || "body" in patch ? { reviewed: false } : {}) } : s) }); }
  async function navigate(next: Screen) {
    if (draft && JSON.stringify(draft) !== savedSnapshot.current) { try { await save(draft); } catch { return false; } }
    setScreen(next); setMobileMenu(false); setModal(null); return true;
  }
  function openProject(project: StudioProject, target: Screen = "outline") {
    savedSnapshot.current = JSON.stringify(project); latestDraft.current = project; setDraft(project); setSaveState("saved"); setSelectedId(project.sections[0]?.id || ""); setScreen(target); setError("");
  }
  async function startNew() { if (await navigate("form")) {generationId.current="";setForm(structuredClone(emptyProduct));} }
  async function action(payload: object, message: string) {
    if (busyLock.current) return false;
    busyLock.current = true; setBusy(true); setError("");
    try { await queue.current.catch(() => {}); const data = await api(payload); setProjects(data); if (message) setToast(message); return data; }
    catch (e) { setError(e instanceof Error ? e.message : "작업을 처리하지 못했어요."); return false; }
    finally { busyLock.current = false; setBusy(false); }
  }
  async function generate(){
    if(busyLock.current)return;busyLock.current=true;setBusy(true);setError("");setGenerationError("");setGenerationStages([]);setImageProgress(null);setScreen("generating");window.scrollTo({top:0});
    if(!generationId.current)generationId.current=crypto.randomUUID();
    try{
      let created:StudioProject|null=null;
      const response=await fetch("/api/studio/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product:form,requestId:generationId.current})});
      if(!response.ok){const data=await response.json();throw new Error(data.error || "구성안 생성을 시작하지 못했어요.");}
      if(!response.body)throw new Error("진행 정보를 받지 못했어요.");
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="";
      const event=(item:GenerationEvent)=>{if(item.type==="error")throw new Error(item.error);if(item.type==="stage")setGenerationStages(stages=>[...stages.filter(s=>s.id!==item.stage.id),item.stage]);else if(item.type==="complete")created=item.project;};
      while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});let boundary;while((boundary=buffer.indexOf("\n"))>=0){const line=buffer.slice(0,boundary);buffer=buffer.slice(boundary+1);if(line.trim())event(JSON.parse(line));}if(done)break;}if(buffer.trim())event(JSON.parse(buffer));
      if(!created)throw new Error("작성 완료 정보를 확인하지 못했어요. 다시 시도해주세요.");
      const project=created as StudioProject;setProjects(projects=>[project,...projects.filter(p=>p.id!==project.id)]);openProject(project);setScreen("generating");
      if(project.product.design?.photoDirection?.mode!=="original"){
        setGenerationStages(stages=>[...stages,{id:"images",label:"사진 연출",detail:"상품 원본을 참고해 산지·모델컷을 준비해요.",state:"running"}]);await generateImages({},project);
      }
      generationId.current="";setScreen("outline");setToast("상품 이야기와 구성안을 준비했어요.");window.scrollTo({top:0});
    }catch(e){setGenerationError(e instanceof Error?e.message:"구성안을 만들지 못했어요.");}
    finally{busyLock.current=false;setBusy(false);}
  }
  async function generateImages(request:ImageRequest={},initial?:StudioProject) {
    const base=initial || latestDraft.current;if(!base || imageLock.current)return;
    const jobs=request.sectionId ? [{sectionId:request.sectionId,scene:request.scene || "lifestyle" as const}] : buildImagePlan(base.product,base.sections);
    if(!jobs.length){setToast("생성할 사진가 없어요. 사진 도구에서 선택 페이지를 다시 생성할 수 있어요.");return;}
    imageLock.current=true;imageStop.current=false;let done=0;
    setImageProgress({busy:true,done:0,total:jobs.length,label:"원본을 참고해 사진을 준비하고 있어요",error:""});
    try {
      const status=await fetch("/api/ai-settings",{cache:"no-store"}).then(r=>r.json());if(!status.configured || !status.enabled)throw new Error("문구와 원본 사진는 준비됐어요. 새 사진는 Gemini API를 연결한 후 다시 생성해주세요.");
      for(const job of jobs){
        if(imageStop.current || latestDraft.current?.id!==base.id)break;
        const current=latestDraft.current;const before=current.sections.find(s=>s.id===job.sectionId);if(!before)continue;
        setImageProgress({busy:true,done,total:jobs.length,label:imageScenes[job.scene].name,error:""});
        await save(current);
        const response=await fetch("/api/generate-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:base.id,sectionId:job.sectionId,scene:job.scene,prompt:request.prompt || "",attachments:request.attachments})});
        const result=await response.json();if(!response.ok)throw new Error(result.error || "사진을 생성하지 못했어요.");
        const latest=latestDraft.current;if(!latest || latest.id!==base.id)break;
        const target=latest.sections.find(s=>s.id===job.sectionId);
        if(!target || target.image!==before.image || target.title!==before.title || target.body!==before.body)throw new Error("생성 중 페이지가 수정되어 사진 적용을 멈췄어요. 수정한 내용은 유지됩니다.");
        const next={...latest,sections:latest.sections.map(section=>section.id===job.sectionId ? {...section,image:result.image,imageMeta:result.imageMeta} : section)};
        changeDraft(next);await save(next);done++;
        setImageProgress({busy:true,done,total:jobs.length,label:imageScenes[job.scene].name,error:""});
      }
      setImageProgress({busy:false,done,total:jobs.length,label:imageStop.current ? "남은 생성을 중지했어요" : "새 사진을 적용했어요",error:""});
    }catch(e){setImageProgress({busy:false,done,total:jobs.length,label:"생성된 사진과 원본을 유지했어요",error:e instanceof Error ? e.message : "사진 생성에 실패했어요."});}
    finally{imageLock.current=false;}
  }
  const selected = draft?.sections.find(s => s.id === selectedId);
  const visibleSections = draft?.sections.filter(s => s.visible) || [];
  function moveSection(id: string, direction: number) {
    if (!draft) return; const list = [...draft.sections]; const from = list.findIndex(s => s.id === id); const to = from + direction;
    if (to < 0 || to >= list.length) return;
    [list[from], list[to]] = [list[to], list[from]]; changeDraft({ ...draft, sections: list });
  }
  function removeSection(id: string) {
    if (!draft) return; const remaining = draft.sections.filter(s => s.id !== id);
    if (!remaining.some(s => s.visible)) { setToast("표시할 섹션이 하나 이상 필요해요."); return; }
    changeDraft({ ...draft, sections: remaining }); if (selectedId === id) setSelectedId(remaining[0].id);
  }
  function toggleSection(section: Section) {
    if (!draft) return;
    if (section.visible && visibleSections.length === 1) { setToast("표시할 섹션이 하나 이상 필요해요."); return; }
    changeDraft({ ...draft, sections: draft.sections.map(s => s.id === section.id ? { ...s, visible: !s.visible } : s) });
  }
  function addSection(kind: SectionKind) {
    if (!draft) return;
    if (draft.sections.length >= 30) { setToast("섹션은 최대 30개까지 추가할 수 있어요."); return; }
    const source = generateSections({ ...draft.product, length: "15" }).find(s => s.kind === kind) || { kind, title: sectionNames[kind], body: "내용을 입력해주세요.", image: "", visible: true, reviewed: false };
    const section = { ...source, id: crypto.randomUUID() };
    changeDraft({ ...draft, sections: [...draft.sections, section] }); setSelectedId(section.id); setModal(null); setToast("새 섹션을 추가했어요.");
  }
  async function upload(files: FileList | File[] | null) {
    if (!files?.length || uploadLock.current) return;
    uploadLock.current = true; setUploading(true); setError("");
    const urls: string[] = []; const target = imageTarget.current;
    try {
      const available = 10 - (target === "form" ? form.images.length : draft?.product.images.length || 0);
      if (available <= 0) throw new Error("상품 사진은 최대 10장까지 올릴 수 있어요.");
      for (const file of Array.from(files).slice(0, target === "section" ? 1 : available)) {
        const data = new FormData(); data.append("file", await prepareImageUpload(file));
        const r = await fetch("/api/uploads", { method: "POST", body: data }); const result = await r.json(); if (!r.ok) throw new Error(result.error); urls.push(result.url);
      }
      if (target === "form") setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      else {
        const current = latestDraft.current;
        if (current) changeDraft({ ...current, product: { ...current.product, images: [...current.product.images, ...urls] }, sections: current.sections.map(s => s.id === selectedId ? (sectionElementTarget.current.startsWith("extra:") ? { ...s, elements: s.elements?.map(element => `extra:${element.id}` === sectionElementTarget.current ? { ...element, image: urls[0] } : element) } : { ...s, image: urls[0], imageMeta:undefined }) : s) });
      }
      setToast("사진을 업로드했어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "사진을 올리지 못했어요."); }
    finally { setUploading(false); uploadLock.current = false; if (fileRef.current) fileRef.current.value = ""; }
  }
  function chooseUpload(target: "form" | "section", element = "image") { imageTarget.current = target; sectionElementTarget.current = element; if (fileRef.current) { fileRef.current.multiple = target === "form"; fileRef.current.click(); } }
  function selectCanvasSection(id: string) { setSelectedId(id); canvasRef.current?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }
  async function download(format: "html" | "images") {
    if (!draft || exporting) return; setExporting(true); setError(""); setExportProgress("변경 내용을 저장하고 있어요.");
    try {
      await save(draft); const element = exportRef.current?.querySelector<HTMLElement>(".product-page"); if (!element) throw new Error("미리보기를 준비하지 못했어요.");
      const usedFonts=new Set<string>(["sans"]);for(const section of draft.sections.filter(s=>s.visible)){for(const key of ["title","body","kicker"] as const){const font=section.format?.[key]?.font;if(font)usedFonts.add(font);}for(const extra of section.elements || [])if(extra.format?.font)usedFonts.add(extra.format.font);}
      const fontsResponse=await fetch(`/api/fonts?ids=${Array.from(usedFonts).join(",")}`);if(!fontsResponse.ok)throw new Error("폰트를 내보내지 못했어요.");const fontCSS=await fontsResponse.text();
      const profile=marketProfiles[exportPlatform];let blob: Blob, count=0;
      await document.fonts.ready; await Promise.all(Array.from(element.querySelectorAll("img")).map(img => img.decode()));
      if (format === "html") {
        const clone = element.cloneNode(true) as HTMLElement;
        for (const img of Array.from(clone.querySelectorAll("img"))) {
          const r = await fetch(img.src); if (!r.ok) throw new Error("사진을 내보내지 못했어요."); const imageBlob = await r.blob();
          img.src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(imageBlob); });
        }
        const title = draft.product.name.replace(/[&<>"']/g, "");
        clone.style.zoom=String(profile.width/860);
        blob = new Blob([`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=${profile.width}"><title>${title}</title><style>${fontCSS}${detailStyles}body{margin:0;background:#fff}.product-page{margin:auto}</style></head><body>${clone.outerHTML}</body></html>`], { type: "text/html;charset=utf-8" });
      } else {
        const { exportMarketImages } = await import("@/lib/market-export-client");
        const result=await exportMarketImages(element,exportPlatform,exportImageFormat,fontCSS,draft.product.name,setExportProgress);blob=result.blob;count=result.count;
      }
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${exportStem(draft.product.name)}-${exportPlatform}-상세페이지.${format==="images"?"zip":"html"}`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000); setToast(format==="images"?`${profile.name}용 이미지 ${count}개를 ZIP으로 다운로드했어요.`:`${profile.name} 너비의 보관용 HTML을 다운로드했어요.`); setModal(null);
    } catch (e) { setError(e instanceof Error ? e.message : "다운로드에 실패했어요."); }
    finally { setExporting(false); }
  }
  const shownProjects = projects.filter(p => (filter !== "starred" || p.starred) && p.product.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "name" ? a.product.name.localeCompare(b.product.name, "ko") : b.updatedAt.localeCompare(a.updatedAt));

  return <div className={`studio-app ${screen === "outline" ? "editor-mode outline-stage-mode" : screen === "editor" ? "editor-mode" : ""}`}>
    <style>{detailStyles}</style><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={e => void upload(e.target.files)} />
    <header className="studio-header"><div className="header-left">{screen === "home" && <button className="icon-button mobile-nav" aria-label="메뉴 열기" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={19} /></button>}<button className="brand" disabled={screen==="generating" && busy} aria-label="열매담 홈" onClick={() => void navigate("home")}><img className="brand-logo" src="/fruitdam-logo.png" alt="열매담 FRUIDAM" width={132} height={54} /></button>{screen !== "home" && <><span className="header-divider" /><span className="header-project">{screen === "form" ? "새 상페이지 만들기" : screen === "generating" ? form.name : draft?.product.name}</span></>}</div><div className="header-right"><AIConnectionButton onClick={() => setModal("ai")} />{draft && (screen === "outline" || screen === "review" || screen === "editor") && <button className={`save-indicator ${saveState}`} onClick={() => void save(draft).catch(() => {})}>{saveState === "saving" ? <LoaderCircle size={13} className="spin" /> : saveState === "error" ? <Save size={13} /> : <Check size={13} />}{saveState === "saving" ? "저장 중" : saveState === "error" ? "다시 저장" : "저장됨"}</button>}{(screen === "editor" || screen === "outline") && <button className="dark-button compact" onClick={() => setModal("download")}><Download size={14} />다운로드</button>}<button className="local-badge" onClick={() => setModal("help")}><i />{storage === "supabase" ? "SUPABASE" : storage === "local" ? "LOCAL" : "\uC5F0\uACB0 \uD655\uC778"}</button><span className="avatar">나</span><span className="profile-name">나의 작업실<small>PERSONAL</small></span></div></header>
    {screen !== "editor" && screen !== "outline" && banner && <div className="welcome-banner"><span><Sparkles size={16} /><strong>아이디어를 팔리는 페이지로.</strong><span>상품의 매력을 발견하는 가장 쉬운 시작</span></span><button onClick={() => setModal("help")}>스튜디오 사용 가이드<ArrowRight size={13} /></button><button className="icon-button" aria-label="배너 닫기" onClick={() => setBanner(false)}><X size={14} /></button></div>}
    {error && <div className="global-error" role="alert"><span>{error}</span>{screen === "home" && <button onClick={() => void load()}>다시 불러오기</button>}<button className="icon-button" aria-label="오류 닫기" onClick={() => setError("")}><X size={14} /></button></div>}

    {screen === "home" && <div className="home-layout">{mobileMenu && <div className="sidebar-shade" onClick={() => setMobileMenu(false)} />}<aside className={`home-sidebar ${mobileMenu ? "open" : ""}`}><div className="workspace-label"><span>M</span><div>My workspace<small>나만의 크리에이티브 공간</small></div><ChevronDown size={13} /></div><nav><button onClick={() => void startNew()}><FilePlus2 size={16} />상세페이지 만들기<Plus size={13} /></button><button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setMobileMenu(false); }}><FolderOpen size={16} />내 작업 내역<span>{projects.length}</span></button><button className={filter === "starred" ? "active" : ""} onClick={() => { setFilter("starred"); setMobileMenu(false); }}><Star size={16} />즐겨찾기<span>{projects.filter(p => p.starred).length}</span></button></nav><div className="sidebar-label">YOUR CREATIVE SPACE</div><div className="sidebar-note"><span>✦</span><p>좋은 상품에<br /><strong>좋은 첫인상을.</strong></p><small>당신만의 이야기를 만들어보세요.</small><span className="note-flower">✳</span></div><div className="sidebar-bottom"><button onClick={() => setModal("help")}><CircleHelp size={16} />도움말 & 사용 가이드</button><span><i />내 컴퓨터에 저장되는 작업실</span></div></aside>
      <main className="dashboard"><div className="breadcrumb"><FolderOpen size={13} />워크스페이스<ChevronRight size={12} />내 작업 내역</div><div className="dashboard-title"><div><span className="eyebrow">YOUR NEXT GREAT PAGE STARTS HERE</span><h1>{filter === "starred" ? "즐겨찾는 작업" : "내 작업 내역"}<span>.</span></h1><p>작은 아이디어가 멋진 상세페이지가 되는 곳.</p></div><button className="dark-button" onClick={() => void startNew()}><Plus size={16} />새 상세페이지</button></div><section className="dashboard-callout"><span className="callout-icon"><LayoutTemplate size={24} /></span><div><span className="small-tag">CREATE SOMETHING GREAT</span><h2>상품의 이야기를, 한 장의 페이지로</h2><p>상품 정보와 사진을 넣으면 편집 가능한 상세페이지 구성안이 완성돼요.</p></div><button onClick={() => { setForm(structuredClone(demoProduct)); setScreen("form"); }}>샘플로 시작하기<ArrowRight size={15} /></button><span className="callout-art">✳</span></section>
      <div className="dashboard-toolbar"><div className="segmented"><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}><FileText size={13} />전체 작업<span>{projects.length}</span></button><button className={filter === "starred" ? "selected" : ""} onClick={() => setFilter("starred")}><Star size={13} />즐겨찾기</button></div><div className="dashboard-tools"><label className="search"><Search size={14} /><input aria-label="작업 검색" placeholder="작업 검색" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="작업 정렬" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">최근 수정 순</option><option value="name">이름 순</option></select></div></div>
      {loading ? <div className="loading-state"><LoaderCircle className="spin" size={24} /><p>작업실을 준비하고 있어요.</p></div> : <div className="project-grid"><button className="new-project-card" onClick={() => void startNew()}><span><FilePlus2 size={24} /></span><strong>새 상세페이지 만들기</strong><small>새로운 가능성을 펼쳐보세요</small><Plus size={16} /></button>{shownProjects.map(project => <article className="project-card" key={project.id}><button className="project-cover" onClick={() => openProject(project)}>{project.product.images[0] ? <img src={project.product.images[0]} alt={project.product.name} /> : <div className="cover-placeholder"><LayoutTemplate size={32} /></div>}<span className="project-category">{project.product.category.split(" · ")[0]}</span><span className="cover-open">이어 편집하기<ArrowRight size={14} /></span></button><button className={`project-star icon-button ${project.starred ? "starred" : ""}`} aria-label={`${project.product.name} 즐겨찾기 ${project.starred ? "해제" : "추가"}`} disabled={busy} onClick={() => void action({ action: "star", id: project.id }, "즐겨찾기를 변경했어요.")}><Star size={15} fill={project.starred ? "currentColor" : "none"} /></button><div className="project-card-body"><button onClick={() => openProject(project)}><h3>{project.product.name}</h3></button><span>{new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(project.updatedAt))} 수정<span>·</span>{project.sections.length}개 섹션</span><div className="project-card-actions"><button aria-label={`${project.product.name} 복제`} disabled={busy} onClick={() => void action({ action: "duplicate", id: project.id }, "작업을 복제했어요.")}><Copy size={13} /></button><button aria-label={`${project.product.name} 삭제`} onClick={() => setDeleteProject(project)}><Trash2 size={13} /></button></div></div></article>)}</div>}{!loading && !shownProjects.length && <p className="empty-message">{query ? "검색 결과가 없어요. 다른 검색어로 찾아보세요." : filter === "starred" ? "별을 눌러 자주 쓰는 작업을 모아보세요." : "첫 번째 상세페이지를 만들어보세요."}</p>}<div className="dashboard-foot"><span><i />별도의 가입 없이, 내 컴퓨터에 안전하게</span><span>Made for your next idea ✦</span></div></main></div>}

    {screen === "form" && <ProductCreationForm form={form} setForm={setForm} uploading={uploading} busy={busy} briefBusy={briefBusy} onBriefBusyChange={setBriefBusy} onUpload={() => chooseUpload("form")} onDrop={files => {imageTarget.current="form";void upload(files);}} onGenerate={() => void generate()} onBack={() => void navigate("home")} onSample={() => {setForm(structuredClone(demoProduct));setToast("샘플 정보를 채웠어요. 자유롭게 바꿔보세요.");}} />}

    {screen === "generating" && <GenerationLoading name={form.name} stages={generationStages} error={generationError} imageProgress={imageProgress} onBack={()=>{generationId.current="";setGenerationError("");setScreen("form");}} onRetry={()=>void generate()}/> }
    {screen !== "generating" && imageProgress && <div className="image-generation-progress" role="status"><div><Sparkles size={15}/><strong>{imageProgress.label}</strong><span>{imageProgress.done}/{imageProgress.total}</span>{imageProgress.busy ? <button onClick={()=>{imageStop.current=true;}}>남은 생성 중지</button> : <button aria-label="사진 생성 상태 닫기" onClick={()=>setImageProgress(null)}><X size={13}/></button>}</div>{imageProgress.error && <p>{imageProgress.error}<button onClick={()=>void generateImages()}>비어 있는 연출컷 다시 생성</button></p>}{imageProgress.busy && <small>대표·옵션 원본 유지 · 사진당 수십 초가 걸릴 수 있어요</small>}</div>}
    {screen === "outline" && draft && <OutlineStudio imageGenerating={Boolean(imageProgress?.busy)} onGenerateImages={request=>generateImages(request)} project={draft} selectedId={selectedId} onSelect={setSelectedId} onChange={changeDraft} onAdd={() => setModal("add")} onUpload={target => chooseUpload("section", target)} onPasteImage={(files, target) => { imageTarget.current = "section"; sectionElementTarget.current = target.startsWith("extra:") ? target : "image"; void upload(files); }} onSave={() => void save(draft).catch(() => {})} onExport={() => setModal("download")} uploading={uploading} onReview={() => void navigate("review")} onBack={() => void navigate("home")} onEditBrief={() => setModal("brief")} onHelp={() => setModal("help")} onAISettings={() => setModal("ai")} saveState={saveState} />}

    {screen === "review" && draft && <CopyReviewPage project={draft} onChange={changeDraft} onBack={() => void navigate("outline")} onContinue={() => void navigate("editor")}><Steps step={3} /></CopyReviewPage>}

    {screen === "editor" && draft && <div className="editor-layout"><aside className="editor-pages"><button className="editor-back" onClick={() => void navigate("review")}><ArrowLeft size={13} />문구 검수로</button><div className="editor-pages-heading"><strong>페이지</strong><span>{draft.sections.length}</span><button className="icon-button" aria-label="섹션 추가" onClick={() => setModal("add")}><Plus size={14} /></button></div><div className="editor-thumbnails">{draft.sections.map((s, index) => <button key={s.id} className={`editor-thumbnail ${s.id === selectedId ? "selected" : ""} ${!s.visible ? "hidden-section" : ""}`} onClick={() => selectCanvasSection(s.id)}><span className="thumbnail-index">{String(index + 1).padStart(2, "0")}</span><span className="thumbnail-image">{s.image ? <img src={s.image} alt="" /> : <LayoutTemplate size={20} />}</span><span className="thumbnail-text"><small>{sectionNames[s.kind]}</small><strong>{s.title}</strong>{!s.visible && <span>숨김</span>}</span></button>)}</div><button className="thumbnail-add" onClick={() => setModal("add")}><Plus size={15} />섹션 추가</button><div className="editor-help"><CircleHelp size={13} />섹션을 클릭하면 편집할 수 있어요</div></aside><section className="canvas-area" ref={canvasRef}><div className="canvas-topline"><span><span />미리보기</span><small>860px · {themes[draft.product.theme].name}</small><button className="icon-button" aria-label="전체 미리보기 다운로드" onClick={() => setModal("download")}><Download size={13} /></button></div><div className="canvas-scroll"><div className="canvas-scale-frame" style={{ width: 860 * zoom / 100 }}><div className="canvas-scaled" style={{ zoom: zoom / 100 }}><DetailPage project={draft} selected={selectedId} onSelect={setSelectedId} /></div></div></div><div className="zoom-control"><button aria-label="축소" onClick={() => setZoom(Math.max(25, zoom - 5))}><ZoomOut size={14} /></button><select aria-label="미리보기 배율" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => 25 + i * 5).map(value => <option key={value} value={value}>{value}%</option>)}</select><button aria-label="확대" onClick={() => setZoom(Math.min(100, zoom + 5))}><ZoomIn size={14} /></button></div></section><aside className="properties-panel"><div className="properties-title"><Settings2 size={16} /><strong>섹션 편집</strong><span>LIVE</span></div>{selected && <><div className="selected-section-info"><span className="section-kind">{sectionNames[selected.kind]}</span><p>문구와 사진을 바꾸면 바로 반영돼요.</p></div><div className="property-fields"><Field label="제목"><textarea rows={3} maxLength={150} value={selected.title} onChange={e => changeSection({ title: e.target.value })} /></Field><Field label="본문" hint="줄바꿈으로 구분"><textarea rows={7} maxLength={5000} value={selected.body} onChange={e => changeSection({ body: e.target.value })} /></Field><div className="field-heading"><span>섹션 이미지</span><button className="text-button" disabled={uploading} onClick={() => chooseUpload("section")}><Upload size={11} />{uploading ? "업로드 중" : "업로드"}</button></div><div className="property-images"><button aria-label="이미지 없음" className={!selected.image ? "selected" : ""} onClick={() => changeSection({ image: "" })}><EyeOff size={20} /></button>{draft.product.images.map((url, i) => <button className={selected.image === url ? "selected" : ""} key={`${url}-${i}`} aria-label={`상품 사진 ${i + 1} 선택`} onClick={() => changeSection({ image: url })}><img src={url} alt={`상품 사진 ${i + 1}`} /></button>)}</div><div className="property-divider" /><Field label="페이지 전체 분위기"><div className="theme-swatches">{Object.entries(themes).map(([key, theme]) => <button key={key} title={theme.name} aria-label={theme.name} className={draft.product.theme === key ? "selected" : ""} style={{ background: theme.accent }} onClick={() => changeDraft({ ...draft, product: { ...draft.product, theme: key as Product["theme"] } })}>{draft.product.theme === key && <Check size={13} />}</button>)}<span>{themes[draft.product.theme].name}</span></div></Field><button className="property-action" onClick={() => toggleSection(selected)}>{selected.visible ? <EyeOff size={14} /> : <Eye size={14} />}{selected.visible ? "완성본에서 이 섹션 숨기기" : "완성본에 이 섹션 표시하기"}</button><div className="property-order"><button disabled={draft.sections[0].id === selectedId} onClick={() => moveSection(selectedId, -1)}><ArrowUp size={13} />위로</button><button disabled={draft.sections[draft.sections.length - 1].id === selectedId} onClick={() => moveSection(selectedId, 1)}><ArrowDown size={13} />아래로</button><button onClick={() => removeSection(selectedId)}><Trash2 size={13} />삭제</button></div></div></>}<div className="properties-footer"><span><i />{saveState === "saved" ? "변경사항이 로컬에 저장되었어요" : saveState === "error" ? "저장에 실패했어요. 다시 저장해주세요" : "변경사항을 저장하고 있어요"}</span><button className="dark-button" onClick={() => setModal("download")}><Download size={14} />완성본 다운로드</button></div></aside></div>}

    {modal === "ai" && <Modal title="API 연결 설정" subtitle="Gemini AI와 농사로 공공데이터" onClose={() => setModal(null)}><AIConnectionSettings onClose={() => setModal(null)} onSaved={setToast} /></Modal>}
    {modal === "brief" && draft && <Modal title="디자인 기획안 및 참고 자료" subtitle="기획안과 리뷰를 확인하며 문구를 다듬어보세요. 이미 작성한 섹션 문구는 유지돼요." onClose={() => { if (!briefBusy) setModal(null); }}><DesignBriefFields value={draft.product.design} onBusyChange={setBriefBusy} onChange={patch => { const current = latestDraft.current; if (current) changeDraft({ ...current, product: { ...current.product, design: { ...structuredClone(emptyDesignBrief), ...current.product.design, ...patch } } }); }} /><button className="dark-button full-width" disabled={briefBusy} onClick={() => setModal(null)}>수정 완료<Check size={14} /></button></Modal>}
    {modal === "help" && <Modal title="좋은 상품에, 좋은 첫인상을." subtitle="열매담 스튜디오 사용 가이드" onClose={() => setModal(null)}><div className="help-steps"><div><b>01</b><span><strong>상품의 이야기를 들려주세요</strong>상품명, 사진, 특징을 입력합니다. 샘플로 먼저 둘러볼 수도 있어요.</span></div><div><b>02</b><span><strong>원하는 흐름으로 구성하세요</strong>섹션을 추가·삭제하고, 화살표로 순서를 바꿔보세요. 숨긴 섹션은 내보내지 않아요.</span></div><div><b>03</b><span><strong>디자인 전, 문구를 확인하세요</strong>제목과 본문을 다듬고, 첨부한 기획안과 리뷰를 비교해보세요. 섹션별 확인 상태도 저장돼요.</span></div><div><b>04</b><span><strong>디자인을 완성하고 내려받으세요</strong>문구·사진·컬러를 편집하고 플랫폼 규격의 이미지 ZIP 또는 보관용 HTML로 저장합니다.</span></div></div><div className="help-note">상단 AI 연결에서 Gemini API 키를 설정하면 자유로운 문구 작성·리뷰 보완 요청을 사용할 수 있어요. 키가 없으면 기본 문구를 생성합니다. 작업과 사진은 data 폴더에 저장됩니다.</div><button className="dark-button full-width" onClick={() => setModal(null)}>좋아요, 시작할게요<ArrowRight size={14} /></button></Modal>}
    {modal === "add" && <Modal title="어떤 이야기를 더할까요?" subtitle="추가한 섹션은 마지막에 배치돼요. 순서는 자유롭게 바꿀 수 있어요." onClose={() => setModal(null)}><div className="section-picker">{Object.entries(sectionNames).map(([kind, name]) => <button key={kind} onClick={() => addSection(kind as SectionKind)}><LayoutTemplate size={19} /><span><strong>{name}</strong><small>{({ hero: "상품의 첫인상을 만드는 메인 화면", story: "상품과 브랜드에 담긴 이야기", benefits: "고객이 알아야 할 상품의 매력", detail: "사진으로 보여주는 세심한 디테일", options: "구성, 용량, 사이즈를 한눈에", shipping: "배송 일정과 구매 안내", faq: "구매 전 궁금한 점을 미리 답해요" })[kind]}</small></span><Plus size={15} /></button>)}</div></Modal>}
    {modal === "download" && draft && <Modal title="이제, 상품을 세상에 소개해요." subtitle={`${visibleSections.length}개 섹션 · ${marketProfiles[exportPlatform].name} ${marketProfiles[exportPlatform].width}px · 숨긴 섹션 제외`} onClose={() => { if (!exporting) setModal(null); }}><MarketDownloadOptions platform={exportPlatform} onPlatform={setExportPlatform} format={exportImageFormat} onFormat={setExportImageFormat} busy={exporting} onImages={() => void download("images")} onHtml={() => void download("html")}/>{exporting && <p className="export-progress" role="status"><LoaderCircle className="spin" size={15} />{exportProgress}</p>}{error && <p className="brief-error" role="alert">{error}</p>}<div className="help-note">ZIP 압축을 풀고 번호순으로 상세설명에 이미지를 올려주세요. HTML은 보관·미리보기용입니다. 대표·썸네일 이미지 규격은 별도이며, 등록 화면의 최신 안내를 확인해주세요.</div></Modal>}
    {modal === "product" && draft && <Modal title="상품 정보 수정" subtitle="상품명과 가격은 완성본에 바로 반영돼요. 섹션 문구는 편집기에서 수정해주세요." onClose={() => setModal(null)}><Field label="상품명"><input maxLength={100} value={draft.product.name} onChange={e => changeDraft({ ...draft, product: { ...draft.product, name: e.target.value } })} /></Field><Field label="카테고리"><select aria-label="카테고리" value={draft.product.category} onChange={e => changeDraft({ ...draft, product: { ...draft.product, category: e.target.value } })}>{categories.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="가격"><input maxLength={100} value={draft.product.price} onChange={e => changeDraft({ ...draft, product: { ...draft.product, price: e.target.value } })} /></Field><button className="dark-button full-width" onClick={() => { if (!draft.product.name.trim()) { setToast("상품명을 입력해주세요."); return; } setModal(null); }}>수정 완료<Check size={14} /></button></Modal>}
    {deleteProject && <Modal title="이 작업을 삭제할까요?" subtitle="삭제한 구성안은 복구할 수 없어요." onClose={() => setDeleteProject(null)}><div className="delete-preview">{deleteProject.product.name}</div><div className="modal-actions"><button className="light-button" onClick={() => setDeleteProject(null)}>취소</button><button className="danger-button" disabled={busy} onClick={async () => { if (await action({ action: "delete", id: deleteProject.id }, "작업을 삭제했어요.")) setDeleteProject(null); }}><Trash2 size={14} />삭제하기</button></div></Modal>}
    {draft && <div className="export-container" aria-hidden="true" ref={exportRef}><DetailPage project={draft} /></div>}
    {toast && <div className="toast" role="status"><span><Check size={14} /></span>{toast}<button className="icon-button" aria-label="알림 닫기" onClick={() => setToast("")}><X size={13} /></button></div>}
  </div>;
}
function Steps({ step }: { step: number }) { return <div className="stepper">{["상품 정보", "구성안 편집", "문구 검수", "디자인 완성"].map((label, i) => <span key={label} className={step === i + 1 ? "current" : step > i + 1 ? "finished" : ""}><b>{step > i + 1 ? <Check size={11} /> : i + 1}</b>{label}{i < 3 && <i />}</span>)}</div>; }
function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  const id = useId();
  return <div className="field"><span className="field-label"><span id={id}>{label}</span>{required && <em>*</em>}{hint && <small>{hint}</small>}</span>{Children.map(children, child => isValidElement(child) && typeof child.type === "string" && ["input", "select", "textarea"].includes(child.type) ? cloneElement(child as React.ReactElement<{ "aria-labelledby"?: string }>, { "aria-labelledby": id }) : child)}</div>;
}
function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,[tabindex="0"]') || []); focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => { if (e.key !== "Tab") return; const all = focusable(); if (e.shiftKey && document.activeElement === all[0]) { e.preventDefault(); all[all.length - 1]?.focus(); } else if (!e.shiftKey && document.activeElement === all[all.length - 1]) { e.preventDefault(); all[0]?.focus(); } };
    document.addEventListener("keydown", trap); return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", trap); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-heading"><button className="icon-button modal-close" aria-label="닫기" onClick={onClose}><X size={19} /></button><span className="modal-symbol"><Sparkles size={21} /></span><h2 id="modal-heading">{title}</h2><p className="modal-subtitle">{subtitle}</p>{children}</div></div>;
}
