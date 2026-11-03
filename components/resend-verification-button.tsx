"use client";
import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";

export function ResendVerificationButton({email}:{email:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  async function resend(){
    if(busy)return;setError("");setMessage("");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setError("위 이메일 입력란에 인증메일을 받을 주소를 입력해주세요.");return;}
    setBusy(true);
    try{const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"resendConfirmation",email:email.trim()})});const result=await response.json();if(!response.ok)throw Error(result.error||"인증메일을 요청하지 못했습니다.");setMessage(result.message);}
    catch(reason){setError(reason instanceof Error?reason.message:"인증메일을 요청하지 못했습니다.");}
    finally{setBusy(false);}
  }
  return <div className="fd-resend-verification"><button type="button" className="fd-text-link" disabled={busy} onClick={()=>void resend()}>{busy?<LoaderCircle size={14} className="spin"/>:<Mail size={14}/>} {busy?"인증메일 요청 중":"인증메일 다시 보내기"}</button>{error&&<p className="fd-form-error" role="alert">{error}</p>}{message&&<p className="fd-form-success" role="status">{message}</p>}</div>;
}
