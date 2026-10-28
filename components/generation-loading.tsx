"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Sparkles } from "lucide-react";
import type { GenerationStage } from "@/lib/generation-progress";
export function GenerationLoading({name,stages,error,onBack,onRetry,imageProgress}:{name:string;stages:GenerationStage[];error:string;onBack:()=>void;onRetry:()=>void;imageProgress:{busy:boolean;done:number;total:number;label:string;error:string}|null}){
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{const start=Date.now();const timer=setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);return()=>clearInterval(timer);},[]);
  const active=stages.filter(s=>s.state==="running").at(-1);
  return <main className="generation-loading"><div className="generation-orbit"><span/><Sparkles size={32}/></div><span className="eyebrow">MAKING YOUR PRODUCT STORY</span><h1>{error?"작성을 마치지 못했어요":"상품 이야기를 구성하고 있어요"}</h1><p>{name}<br/>{error?"입력한 상품 정보는 유지되어 있어요.":"진행 내용을 확인하고 있어요. 완료되면 편집 화면으로 이동합니다."}</p><section className="generation-live" aria-live="polite"><div><span>{error?"확인 필요":"현재 진행 중"}</span><time>{Math.floor(elapsed/60)}분 {elapsed%60}초</time></div><strong>{imageProgress?.busy?imageProgress.label:active?.label || "작업 준비"}</strong></section><ol className="generation-stage-list">{stages.map(stage=><li key={stage.id} className={stage.state}><span>{stage.state==="complete"?<Check size={14}/>:<LoaderCircle className="spin" size={14}/>}</span><div><strong>{stage.label}</strong></div></li>)}</ol>{error && <div className="generation-failure" role="alert"><p>{error}</p><button className="light-button" onClick={onBack}><ArrowLeft size={13}/>입력 내용 확인</button><button className="dark-button" onClick={onRetry}>다시 시도</button></div>}</main>;
}
