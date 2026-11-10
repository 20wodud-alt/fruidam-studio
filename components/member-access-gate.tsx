import type { Member } from "@/lib/commerce";
import { ServiceHeader } from "./service-header";

export function MemberAccessGate({member,unavailable=false}:{member:Member|null;unavailable?:boolean}){
  return <><ServiceHeader active="/studio" member={member}/><main className="fd-container fd-section fd-center"><span className="fd-eyebrow">MEMBERS ONLY</span><h1>{unavailable?"회원 정보를 확인하지 못했습니다.":member?"운영자 승인을 기다리고 있습니다.":"로그인 후 이용해주세요."}</h1><p className="fd-lead">{unavailable?"잠시 후 다시 시도해주세요.":"상품 상세·가격 확인과 상세페이지 제작은 가입·이메일 인증 후 운영자 승인이 완료된 회원에게 제공됩니다."}</p><div className="fd-together-actions">{!member&&!unavailable&&<a className="fd-button" href="/login">로그인 · 회원가입</a>}<a className="fd-button outline" href="/catalog">상품 둘러보기</a>{member&&<a className="fd-button outline" href={member.role==="supplier"?"/supplier":"/seller"}>나의 승인 상태 확인</a>}</div></main></>;
}
