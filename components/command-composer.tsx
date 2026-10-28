"use client";
import { prepareImageUpload } from "@/lib/client-upload";
import { hookCopyRequest } from "@/lib/ai-request-context";
import type { AssistantAttachment } from "@/lib/assistant-attachments";
import { useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, LoaderCircle, Mic, MicOff, Plus, Send, Settings2, X } from "lucide-react";
type RecognitionResult = {isFinal:boolean;0:{transcript:string}};
type Recognition = {lang:string;interimResults:boolean;continuous:boolean;onresult:((event:{resultIndex:number;results:ArrayLike<RecognitionResult>})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type RecognitionWindow = Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
type Props = {value:string;onChange:(value:string)=>void;onSend:(value:string,attachments:AssistantAttachment[])=>Promise<boolean|undefined>;busy:boolean;canHook:boolean;selectedLabel:string;onSettings:()=>void};

export function CommandComposer({value,onChange,onSend,busy,canHook,selectedLabel,onSettings}:Props){
  const [supported,setSupported]=useState(false),[listening,setListening]=useState(false),[interim,setInterim]=useState(""),[error,setError]=useState(""),[uploading,setUploading]=useState(false);
  const [attachments,setAttachments]=useState<AssistantAttachment[]>([]);
  const recognition=useRef<Recognition|null>(null),fileInput=useRef<HTMLInputElement>(null),fileLock=useRef(false);
  const latest=useRef({onSend,onChange,value,attachments,busy});
  useEffect(()=>{latest.current={onSend,onChange,value,attachments,busy};},[onSend,onChange,value,attachments,busy]);
  useEffect(()=>{const timer=setTimeout(()=>{const w=window as RecognitionWindow;setSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));},0);return()=>{clearTimeout(timer);if(recognition.current){recognition.current.onend=null;recognition.current.abort();}};},[]);
  async function send(text=value){
    if(!text.trim()||latest.current.busy||fileLock.current)return;
    if(await latest.current.onSend(text,latest.current.attachments))setAttachments([]);
  }
  async function attachFiles(files:FileList|null){
    if(!files?.length||fileLock.current||busy||listening)return;
    setError("");const list=Array.from(files),isImage=(f:File)=>/\.(jpe?g|png|webp|avif)$/i.test(f.name);
    try{
      if(attachments.length+list.length>3||attachments.filter(a=>a.type==="image").length+list.filter(isImage).length>2)throw new Error("파일은 최대 3개, 이미지는 최대 2장까지 첨부해주세요.");
      if(list.some(f=>!isImage(f)&&!/\.(txt|md|csv|xlsx)$/i.test(f.name)))throw new Error("JPG·PNG·WebP·AVIF 또는 TXT·MD·CSV·XLSX 파일을 첨부해주세요.");
      if(list.some(f=>!f.size||f.size>(isImage(f)?8:2)*1024*1024))throw new Error("이미지는 8MB, 문서는 2MB 이하로 첨부해주세요.");
    }catch(e){setError((e as Error).message);if(fileInput.current)fileInput.current.value="";return;}
    fileLock.current=true;setUploading(true);const added:AssistantAttachment[]=[];
    try{
      for(const file of list){
        const image=isImage(file),data=new FormData();data.append("file",image ? await prepareImageUpload(file) : file);
        const response=await fetch(image?"/api/uploads":"/api/import-text",{method:"POST",body:data}),result=await response.json();
        if(!response.ok)throw new Error(result.error||"파일을 첨부하지 못했어요.");
        const id=crypto.randomUUID(),name=file.name.slice(0,200);
        if(image)added.push({id,name,type:"image",url:result.url});
        else{if(typeof result.text!=="string")throw new Error("문서 내용을 읽지 못했어요.");added.push({id,name,type:"text",text:result.text.slice(0,2000),truncated:result.truncated||result.text.length>2000});}
      }
    }catch(e){setError(e instanceof Error?e.message:"파일을 첨부하지 못했어요.");}
    finally{setAttachments(current=>[...current,...added]);fileLock.current=false;setUploading(false);if(fileInput.current)fileInput.current.value="";}
  }
  function toggleVoice(){
    if(listening){recognition.current?.stop();return;}
    const w=window as RecognitionWindow,Constructor=w.SpeechRecognition||w.webkitSpeechRecognition;
    if(!Constructor){setError("이 브라우저는 음성 입력을 지원하지 않아요. Chrome 또는 Edge에서 사용하거나 글로 입력해주세요.");return;}
    const instance=new Constructor();recognition.current=instance;instance.lang="ko-KR";instance.continuous=false;instance.interimResults=true;
    let transcript="";const prefix=latest.current.value.trim();let failed=false;
    instance.onresult=event=>{let temporary="";for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal)transcript+=event.results[i][0].transcript;else temporary+=event.results[i][0].transcript;}setInterim(temporary);latest.current.onChange([prefix,transcript,temporary].filter(Boolean).join(" "));};
    instance.onerror=event=>{failed=true;setListening(false);setError(event.error==="not-allowed"?"마이크 사용 권한이 필요해요. 브라우저 설정에서 허용해주세요.":event.error==="no-speech"?"음성을 듣지 못했어요. 다시 말해주세요.":"음성 인식을 완료하지 못했어요. 네트워크와 마이크를 확인해주세요.");};
    instance.onend=()=>{setListening(false);setInterim("");const final=[prefix,transcript.trim()].filter(Boolean).join(" ");if(transcript.trim()&&!failed){latest.current.onChange(final);void send(final);}};
    setError("");setInterim("");try{instance.start();setListening(true);}catch{setError("마이크를 시작하지 못했어요. 잠시 후 다시 시도해주세요.");}
  }
  return <div className={`os-voice-composer ${listening?"listening":""}`}>
    <div className="composer-heading"><span><span/>{selectedLabel}</span><button onClick={onSettings} aria-label="AI 연결 설정"><Settings2 size={12}/>AI 설정</button></div>
    <div className="composer-quick-actions"><button title={canHook?"선택한 글 박스만 후킹 문구로 수정":"후킹할 글 박스를 먼저 선택해주세요"} disabled={busy||listening||uploading||!canHook} onClick={()=>void send(hookCopyRequest)}>선택 후킹</button></div>
    <input ref={fileInput} type="file" hidden multiple aria-label="채팅 첨부파일 선택" accept=".jpg,.jpeg,.png,.webp,.avif,.txt,.md,.csv,.xlsx" onChange={e=>void attachFiles(e.target.files)}/>
    {attachments.length>0&&<div className="composer-attachments" aria-label="첨부파일 목록">{attachments.map(file=><div key={file.id} className="composer-attachment" title={file.type==="text"&&file.truncated?"토큰 절약을 위해 앞 2,000자만 참고해요. AI 요청 전송 시 Gemini에 전달됩니다.":"AI 요청 전송 시 Gemini에 참고 자료로 전달됩니다."}>{file.type==="image"?<ImageIcon size={13}/>:<FileText size={13}/>}<span>{file.name}{file.type==="text"&&file.truncated?" · 일부":""}</span><button type="button" disabled={busy||uploading||listening} aria-label={`${file.name} 첨부 제거`} onClick={()=>setAttachments(current=>current.filter(a=>a.id!==file.id))}><X size={12}/></button></div>)}</div>}
    <form onSubmit={e=>{e.preventDefault();if(!listening)void send();}}>
      <textarea aria-label="글·음성 편집 요청" rows={3} maxLength={5000} value={value} onChange={e=>onChange(e.target.value)} placeholder="예: 제목을 더 고급스럽게 바꿔줘 / 글씨를 48px로 / 사진을 오른쪽 20px 이동" onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();if(!listening)void send();}}}/>
      <div className="composer-footer">
        <button type="button" className="composer-attach" aria-label="파일 첨부" title="이미지·문서 첨부 · 최대 3개" disabled={busy||uploading||listening||attachments.length>=3} onClick={()=>fileInput.current?.click()}>{uploading?<LoaderCircle size={16} className="spin"/>:<Plus size={18}/>}</button>
        <span className="composer-footer-space"/>
        <div className="composer-right-actions"><button type="button" className={`composer-mic ${listening?"active":""}`} aria-pressed={listening} aria-label={listening?"음성 입력 중지":"음성 입력 시작"} title={supported?"브라우저 음성 인식 · 인식 완료 후 자동 적용":"지원 브라우저에서 음성 입력 가능"} disabled={busy||uploading} onClick={toggleVoice}>{listening?<MicOff size={16}/>:<Mic size={16}/>}</button><button className="composer-send" aria-label="편집 요청 적용" disabled={busy||uploading||!value.trim()||listening} type="submit">{busy?<LoaderCircle size={15} className="spin"/>:<Send size={15}/>}</button></div>
      </div>
    </form>
    {listening&&<div className="voice-live-status" role="status"><span className="voice-wave" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i} style={{animationDelay:`${i*.12}s`}}/>)}</span><span>음성 인식 중… 말씀해주세요</span></div>}
    {uploading&&<p className="composer-transcript" role="status">파일을 첨부하고 있어요…</p>}{interim&&<p className="composer-transcript" role="status">{interim}</p>}{error&&<p className="composer-error" role="alert">{error}</p>}
  </div>;
}
