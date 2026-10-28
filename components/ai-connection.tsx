"use client";
import { useEffect, useState } from "react";
import { Check, ExternalLink, KeyRound, Leaf, LoaderCircle, Settings2, Sparkles, X } from "lucide-react";
import { defaultImageModel, imageModels } from "@/lib/image-plan";
import { geminiModelGroups, geminiModels } from "@/lib/gemini-models";
import { NongsaroSettings } from "./nongsaro-settings";
type Status = { imageModel?:string; configured:boolean; enabled:boolean; model:string; research:boolean; fromEnvironment?:boolean; needsNewKey?:boolean };
export function AIConnectionButton({onClick}:{onClick:()=>void}) {
  const [status,setStatus]=useState<Status|null>(null);
  useEffect(()=>{const load=()=>{void fetch("/api/ai-settings",{cache:"no-store"}).then(r=>r.json()).then(setStatus).catch(()=>{});};load();window.addEventListener("ai-settings-changed",load);return()=>window.removeEventListener("ai-settings-changed",load);},[]);
  return <button className={`ai-connect-button ${status?.configured && status.enabled ? "connected" : ""}`} onClick={onClick}><span/><Settings2 size={12}/>{status?.configured && status.enabled ? "Gemini 키 등록됨" : "API 연결"}</button>;
}
export function AIConnectionSettings({onClose,onSaved}:{onClose:()=>void;onSaved?:(message:string)=>void}) {
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<"gemini"|"nongsaro">("gemini");
  const [status,setStatus]=useState<Status>({configured:false,enabled:true,model:"gemini-3.8-flash",imageModel:defaultImageModel,research:true});
  const [changingKey,setChangingKey]=useState(false);const [customModel,setCustomModel]=useState(false);
  const [key,setKey]=useState("");const [busy,setBusy]=useState(false);const [testing,setTesting]=useState(false);const [error,setError]=useState("");const [message,setMessage]=useState("");
  useEffect(()=>{void fetch("/api/ai-settings",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);setStatus(data);setCustomModel(!geminiModels.some(model=>model.id===data.model));}).catch(()=>setError("설정을 불러오지 못했어요. 다시 열어주세요.")).finally(()=>setLoading(false));},[]);
  function edited(){setMessage("");setError("");}
  async function save(clearKey=false) {
    setBusy(true);edited();
    try {const r=await fetch("/api/ai-settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...status,apiKey:key || undefined,clearKey})});const data=await r.json();if(!r.ok)throw new Error(data.error);setStatus(data);setKey("");setChangingKey(false);setMessage(clearKey ? "Gemini 키를 제거했어요." : "Gemini 설정을 저장했어요.");window.dispatchEvent(new Event("ai-settings-changed"));if(!clearKey){onSaved?.(status.enabled ? "Gemini 연결 확인 및 설정 저장을 완료했어요." : "Gemini 사용 중지 설정을 저장했어요.");onClose();}}
    catch(e){setError(e instanceof Error ? e.message : "설정을 저장하지 못했어요.");}finally{setBusy(false);}
  }
  async function test() {
    setTesting(true);edited();
    try {const r=await fetch("/api/ai-settings/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey:key || undefined,model:status.model})});const data=await r.json();if(!r.ok)throw new Error(data.error);setStatus(current=>({...current,model:data.model}));setMessage(data.message);}
    catch(e){setError(e instanceof Error ? e.message : "연결을 확인하지 못했어요.");}finally{setTesting(false);}
  }
  const pending=busy || testing;
  return <fieldset className="integration-fieldset" disabled={loading || pending}><div className="integration-tabs" role="tablist" aria-label="연결 서비스"><button role="tab" aria-selected={tab==="gemini"} className={tab==="gemini" ? "active" : ""} onClick={()=>setTab("gemini")}><Sparkles size={14}/>Gemini AI</button><button role="tab" aria-selected={tab==="nongsaro"} className={tab==="nongsaro" ? "active" : ""} onClick={()=>setTab("nongsaro")}><Leaf size={14}/>농사로 공공데이터<span>준비</span></button></div>
    {tab === "nongsaro" ? <NongsaroSettings onClose={onClose}/> : <div className="ai-settings-content" role="tabpanel" aria-label="Gemini 설정"><div className="ai-settings-status"><KeyRound size={19}/><span>{status.configured ? "Gemini API 키가 등록되어 있어요" : "Gemini API 키를 연결해주세요"}<small>{status.fromEnvironment ? "서버의 Gemini 환경변수 키를 사용합니다." : "키는 내 컴퓨터에 저장하고 서버에서만 사용합니다."}</small></span></div>{status.needsNewKey && <p className="integration-hint">이전 OpenAI 키는 Gemini에 사용하지 않아요. Google AI Studio에서 발급한 키를 새로 등록해주세요.</p>}
      <label className="ep-field"><span>Gemini API 키<a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">키 발급<ExternalLink size={10}/></a></span><div className="saved-key-row"><input type="password" aria-label="Gemini API 키" autoComplete="off" value={status.configured && !changingKey ? "•".repeat(24) : key} readOnly={status.configured && !changingKey} onChange={e=>{setKey(e.target.value);edited();}} placeholder="Google AI Studio에서 발급한 키"/>{status.configured && !status.fromEnvironment && <button type="button" className="light-button" onClick={()=>{setChangingKey(!changingKey);setKey("");edited();}}>{changingKey ? "변경 취소" : "키 변경"}</button>}</div>{status.configured && !changingKey && <small className="saved-key-note"><Check size={11}/>저장된 키를 사용 중이에요. 다시 입력할 필요가 없어요.</small>}</label>
      <label className="ep-field"><span>사용할 모델</span><select aria-label="Gemini 모델" value={customModel ? "custom" : status.model} onChange={e=>{const custom=e.target.value==="custom";setCustomModel(custom);if(!custom)setStatus({...status,model:e.target.value});edited();}}>{geminiModelGroups.map(group=><optgroup key={group.label} label={group.label}>{group.models.map(model=><option key={model.id} value={model.id}>{model.name}</option>)}</optgroup>)}<option value="custom">다른 모델 ID 직접 입력</option></select><small className="integration-field-note">{customModel ? "Google AI Studio에서 사용 가능한 텍스트 모델 ID를 입력하세요." : geminiModels.find(model=>model.id===status.model)?.description} 모델별 요금과 사용 가능 여부는 Google 계정에 따라 달라요.</small></label>
      {customModel && <label className="ep-field"><span>직접 입력할 모델 ID</span><input aria-label="Gemini 모델 ID" value={status.model} onChange={e=>{setStatus({...status,model:e.target.value});edited();}} placeholder="gemini-3.8-flash"/></label>}
      <label className="ep-field"><span>사진 생성 모델</span><select aria-label="Gemini 이미지 모델" value={status.imageModel || defaultImageModel} onChange={e=>{setStatus({...status,imageModel:e.target.value});edited();}}>{imageModels.map(model=><option key={model.id} value={model.id}>{model.name}</option>)}</select><small className="integration-field-note">문구 모델과 별도로 사용되며, 상품 참고 사진로 새 이미지를 생성해요.</small></label>
      <p className="integration-field-note">키의 접두어나 길이로 유효 여부를 판단하지 않아요. 연결 확인을 누르면 Google 서버에서 인증과 모델 접근을 확인합니다.</p><button className="light-button integration-test" disabled={pending || (!key.trim() && !status.configured) || !status.model.trim()} onClick={()=>void test()}>{testing ? <LoaderCircle size={14} className="spin"/> : <Check size={14}/>}키·모델 연결 확인</button>
      <label className="ai-toggle"><input type="checkbox" checked={status.enabled} onChange={e=>{setStatus({...status,enabled:e.target.checked});edited();}}/><span>Gemini 문구 작성·자연어 편집 사용</span></label><label className="ai-toggle"><input type="checkbox" checked={status.research} onChange={e=>{setStatus({...status,research:e.target.checked});edited();}}/><span>전체 문구 작성 시 Google 검색 사용 · 쿠팡 중심</span></label>
      <p className="ai-settings-note">AI 요청 시 상품 정보·기획안·리뷰 텍스트가 Google Gemini로 전송됩니다. 모델·검색 사용 요금과 할당량은 Google 계정에 적용됩니다. 실제 검색 출처는 문구 검수에서 확인할 수 있어요.</p>{error && <p className="brief-error" role="alert">{error}</p>}{message && <p className="brief-status" role="status"><Check size={13}/>{message}</p>}<div className="ai-settings-actions">{status.configured && !status.fromEnvironment && <button className="text-button" disabled={pending} onClick={()=>void save(true)}><X size={12}/>키 제거</button>}<button className="light-button" onClick={onClose}>닫기</button><button className="dark-button" disabled={pending || !status.model.trim()} onClick={()=>void save()}>{busy ? <LoaderCircle size={14} className="spin"/> : <Check size={14}/>} {busy ? "연결 확인 후 저장 중…" : "설정 저장"}</button></div></div>}</fieldset>;
}
