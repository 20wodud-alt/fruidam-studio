"use client";
import { useState } from "react";
import { Check, Clock3, LoaderCircle, Pencil } from "lucide-react";
import Link from "next/link";
import type { Member } from "@/lib/commerce";

export function SupplierMemberCard({ member, busy, act, onOpen }: { member:Member; busy:boolean; act:(payload:Record<string,unknown>,message?:string)=>Promise<boolean|undefined>;onOpen:(member:Member)=>void }){
  const [saved,setSaved]=useState(false),[saving,setSaving]=useState(false);
  const saveComplete=saved&&member.approved;
  return <article className="fd-panel fd-supplier-member-card">
    <div className="fd-between"><div><h3><button type="button" className="fd-supplier-name" disabled={busy} onClick={()=>onOpen(member)} aria-label={`${member.name} 입점 신청 내용 보기 및 수정`}>{member.name}<Pencil size={13}/></button></h3><p>{member.email}</p>{member.awaitingSignup&&<><small className="fd-caption">이 이메일로 가입·인증하면 입점 계정이 연결됩니다.</small><Link className="fd-text-link fd-account-setup-link" href={`/account/setup?email=${encodeURIComponent(member.email)}&name=${encodeURIComponent(member.name)}`}>비밀번호 설정하기 →</Link></>}</div>
      <div className="fd-supplier-status-actions"><span className={`fd-status fd-supplier-approval ${member.approved?"is-approved":"is-pending"}`} role="status" aria-live="polite">{member.approved?<Check size={12}/>:<Clock3 size={12}/>} {member.approved?"입점 승인":"승인 대기"}</span>{member.approved&&<button type="button" className="fd-revoke-supplier" disabled={busy} aria-label={`${member.name} 입점 승인 취소`} onClick={()=>{if(window.confirm(`${member.name}의 입점 승인을 취소할까요? 신규 상품 등록·발주가 중단되고 판매 중인 상품이 중단됩니다. 기존 주문과 정산 내역은 유지됩니다.`))void act({action:"revokeSupplierApproval",id:member.id},"입점 승인을 취소했습니다.");}}>입점 승인 취소</button>}</div>
    </div>
    <form className="fd-inline-form" onSubmit={async event=>{event.preventDefault();if(busy||saving)return;const fields=new FormData(event.currentTarget);setSaved(false);setSaving(true);try{const success=await act({action:"approveSupplier",id:member.id,commission:Math.round(Number(fields.get("commission"))*100)},"공급처와 수수료율을 저장했습니다.");setSaved(success===true);}finally{setSaving(false);}}}>
      <label>배송비 포함 수수료율 (%) <input name="commission" type="number" min="0" max="100" step="0.01" defaultValue={member.commission/100} required disabled={busy||saving} onChange={()=>setSaved(false)}/></label><button className={`fd-button small fd-supplier-save ${saveComplete?"is-saved":"outline"}`} disabled={busy||saving}>{saving?<><LoaderCircle size={13} className="spin"/>저장 중</>:saveComplete?<><Check size={13}/>저장 완료</>:"승인·수수료 저장"}</button>
    </form>
  </article>;
}
