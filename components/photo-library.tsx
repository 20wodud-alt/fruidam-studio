"use client";
/* eslint-disable @next/next/no-img-element */
import {useEffect,useState} from "react";
import {Check,RefreshCw} from "lucide-react";
import {excludedPhotoUrls,projectPhotos,type PhotoAsset} from "@/lib/photo-assets";
import type {StudioProject} from "@/lib/studio";
export function PhotoLibrary({project,selected,busy,onChoose}:{project:StudioProject;selected:string;busy:boolean;onChoose:(asset:PhotoAsset)=>void}){
  const [stored,setStored]=useState<{projectId:string;photos:PhotoAsset[]}>({projectId:"",photos:[]}),[filter,setFilter]=useState("all"),[limit,setLimit]=useState(60),[error,setError]=useState(""),[reload,setReload]=useState(0);
  useEffect(()=>{if(busy)return;const abort=new AbortController();fetch(`/api/photos?projectId=${encodeURIComponent(project.id)}`,{cache:"no-store",signal:abort.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);if(!Array.isArray(data))throw new Error("사진 목록을 확인하지 못했어요.");if(!abort.signal.aborted){setStored({projectId:project.id,photos:data});setError("");}}).catch(e=>{if(e.name!=="AbortError")setError(e.message);});return()=>abort.abort();},[project.id,busy,reload]);
  const excluded=excludedPhotoUrls(project);
  const currentStored=stored.projectId===project.id?stored.photos.filter(asset=>asset.source!=="reference"&&!excluded.has(asset.url)&&(!asset.projectId||asset.projectId===project.id)):[];
  const merged=new Map(currentStored.map(asset=>[asset.url,asset]));projectPhotos(project).forEach(asset=>{if(merged.get(asset.url)?.source!=="ai")merged.set(asset.url,asset);});
  const photos=[...merged.values()].filter(asset=>filter==="all"||(filter==="ai"?asset.source==="ai":asset.source!=="ai"));
  return <section className="photo-library"><div className="tl-group-title">현재 상세페이지의 사진<span>{merged.size}장</span></div><div className="photo-library-filters">{[["all","전체"],["ai","AI 생성"],["other","원본·보관"]].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setLimit(60);}}>{label}</button>)}<button aria-label="사진 목록 새로고침" onClick={()=>setReload(n=>n+1)}><RefreshCw size={12}/></button></div>{error&&<p className="brief-error" role="alert">{error}</p>}<div className="tl-image-grid photo-library-grid">{photos.slice(0,limit).map((asset,i)=><button key={asset.url} aria-label={`보관 사진 ${i+1} 적용 · ${asset.name}`} title={asset.name} onClick={()=>onChoose(asset)}><img src={asset.url} alt={asset.name} loading="lazy"/><small>{asset.source==="ai"?"AI 생성":asset.source==="reference"?"참고":asset.source==="upload"?"원본":"보관"}</small>{selected===asset.url&&<span><Check size={11}/></span>}</button>)}</div>{!photos.length&&<p className="tl-description">선택한 분류에 사진이 없어요.</p>}{photos.length>limit&&<button className="tl-upload" onClick={()=>setLimit(n=>n+60)}>사진 더 보기 ({photos.length-limit})</button>}</section>;
}
