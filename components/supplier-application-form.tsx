"use client";
import { supplierBusinessTypes, type Member, type SupplierApplication } from "@/lib/commerce";
import { LoaderCircle, Save } from "lucide-react";

const fields=["businessType","representative","phone","address","businessNumber","mainProducts","introduction"] as const;
export function readSupplierApplication(form:FormData){return Object.fromEntries(fields.map(key=>[key,String(form.get(key)||"")]));}

export function SupplierApplicationFields({value}:{value?:SupplierApplication}){
  return <div className="fd-supplier-application-fields">
    <div className="fd-form-row"><label>업체 유형<select name="businessType" defaultValue={value?.businessType||""}><option value="">선택해주세요</option>{Object.entries(supplierBusinessTypes).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>대표자명<input name="representative" defaultValue={value?.representative||""} maxLength={60} autoComplete="name"/></label></div>
    <div className="fd-form-row"><label>연락처<input name="phone" type="tel" defaultValue={value?.phone||""} maxLength={30} autoComplete="tel" placeholder="예: 010-1234-5678"/></label><label>사업자등록번호 (선택)<input name="businessNumber" defaultValue={value?.businessNumber||""} maxLength={12} inputMode="numeric" placeholder="예: 123-45-67890"/></label></div>
    <label>농가·업체 주소<input name="address" defaultValue={value?.address||""} maxLength={300} autoComplete="street-address"/></label>
    <label>주요 취급 과일<input name="mainProducts" defaultValue={value?.mainProducts||""} maxLength={300} placeholder="예: 사과, 감귤, 샤인머스캣"/></label>
    <label>농가·업체 소개<textarea name="introduction" defaultValue={value?.introduction||""} maxLength={2000} rows={5} placeholder="농가 소개, 공급 가능한 상품과 위탁 배송 준비 상황 등을 작성해주세요."/></label>
  </div>;
}

export function SupplierApplicationForm({member,busy,error,onSubmit}:{member:Member;busy:boolean;error:string;onSubmit:(payload:Record<string,unknown>)=>Promise<void>}){
  return <form className="fd-form fd-supplier-application" onSubmit={event=>{event.preventDefault();if(busy)return;const form=new FormData(event.currentTarget);void onSubmit({name:form.get("name"),supplierApplication:readSupplierApplication(form)});}}>
    <div className="fd-application-summary"><span className={`fd-status ${member.approved?"approved":"pending"}`}>{member.approved?"입점 승인":"승인 대기"}</span><span>신청일 {new Intl.DateTimeFormat("ko-KR",{dateStyle:"medium",timeZone:"Asia/Seoul"}).format(new Date(member.createdAt))}</span></div>
    <fieldset disabled={busy}>
      <label>농가·직매장 이름<input name="name" defaultValue={member.name} required maxLength={60} autoComplete="organization"/></label>
      <label>로그인 이메일<input type="email" value={member.email} readOnly/><small>로그인에 사용하는 계정 이메일입니다.</small></label>
      {!member.supplierApplication&&<p className="fd-caption">기존 신청에 작성되지 않은 항목은 비어 있습니다. 확인한 정보를 보완해 저장해주세요.</p>}
      <SupplierApplicationFields value={member.supplierApplication}/>
      {member.supplierApplication?.updatedAt&&<p className="fd-caption">최근 수정 {new Intl.DateTimeFormat("ko-KR",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Seoul"}).format(new Date(member.supplierApplication.updatedAt))}</p>}
      {error&&<p className="fd-form-error" role="alert">{error}</p>}
      <button className="fd-button" disabled={busy}>{busy?<LoaderCircle size={16} className="spin"/>:<Save size={16}/>} {busy?"저장 중":"입점 정보 저장"}</button>
    </fieldset>
  </form>;
}
