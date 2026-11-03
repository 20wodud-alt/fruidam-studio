"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, KeyRound, LoaderCircle } from "lucide-react";

export function SupplierAccountSetup({email,name}:{email:string;name:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[complete,setComplete]=useState(false),[verificationRequired,setVerificationRequired]=useState(true);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    const form=event.currentTarget,fields=new FormData(form);
    const password=String(fields.get("password")||"");
    setError("");
    if(password!==fields.get("confirmPassword")){setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");return;}
    setBusy(true);
    try{
      const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"signup",email:fields.get("email"),name:fields.get("name"),password,role:"supplier"})});
      const result=await response.json();if(!response.ok)throw Error(result.error||"계정 설정을 접수하지 못했습니다.");
      form.reset();setVerificationRequired(!!result.confirmationRequired);setComplete(true);
    }catch(reason){setError(reason instanceof Error?reason.message:"계정 설정을 접수하지 못했습니다.");}
    finally{setBusy(false);}
  }
  return <main className="fd-auth-page fd-account-setup">
    <div className="fd-auth-story"><span className="fd-eyebrow">YOUR FARM, YOUR ACCOUNT</span><h1>좋은 과일의 시작,<br/>나의 입점 계정으로.</h1><p>등록된 농가·직매장 정보와 상품을<br/>이메일 인증 후 연결합니다.</p><img src="/photos/fruit-citrus.webp" alt="햇살처럼 싱그러운 감귤"/></div>
    <section className="fd-auth-form"><KeyRound size={30}/><h2>입점 계정 비밀번호 설정</h2>
      {complete?<div className="fd-account-setup-complete" role="status"><Check size={24}/><h3>계정 설정을 접수했습니다.</h3><p>{verificationRequired?"입력한 이메일로 받은 인증 링크를 확인한 뒤 로그인해주세요. 인증 후 기존 입점 정보와 상품이 연결됩니다.":"설정한 이메일과 새 비밀번호로 로그인하면 기존 입점 정보와 상품이 연결됩니다."}</p><Link href="/login" className="fd-button">로그인하기 <ArrowRight size={16}/></Link></div>:<><p>등록된 업체의 로그인 계정을 만드는 화면입니다.<br/>새 비밀번호를 두 번 입력해주세요.</p><form onSubmit={event=>void submit(event)}><fieldset disabled={busy} className="fd-account-setup-fields">
        <label>농가·직매장 이름<input name="name" required maxLength={60} autoComplete="organization" defaultValue={name} readOnly={!!name}/></label>
        <label>이메일<input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={email} readOnly={!!email}/></label>
        <label>새 비밀번호<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="10자 이상 입력해주세요"/></label>
        <label>새 비밀번호 확인<input name="confirmPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="새 비밀번호를 다시 입력해주세요"/></label>
        {error&&<p className="fd-form-error" role="alert">{error}</p>}
        <button className="fd-button" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<KeyRound size={16}/>} {busy?"설정 중":"비밀번호 설정 및 이메일 인증"}</button>
      </fieldset></form><small>이메일 인증 후 로그인하면 운영자가 등록한 입점 정보가 연결됩니다. 기존 입점 승인 상태와 상품은 유지됩니다.</small><p className="fd-auth-switch">이미 로그인 계정이 있다면 <Link href="/login">로그인하기</Link></p></>}
    </section>
  </main>;
}
