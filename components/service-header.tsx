"use client";

import { useState, type MouseEventHandler } from "react";
import { ArrowRight, Bell, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import type { Member } from "@/lib/commerce";
import "@/app/commerce.css";

const links = [
  ["/about", "열매담 이야기"], ["/catalog", "공급상품 둘러보기"],
  ["/studio", "상세페이지 스튜디오"], ["/pricing", "요금제"], ["/supplier", "농가·직매장 입점"],
];

export function ServiceHeader({ active, member, unread = false, onNotices, onNavigate, beforeLogout }: {
  active: string; member?: Member | null; unread?: boolean; onNotices?: () => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
  beforeLogout?:()=>Promise<boolean>;
}) {
  const [mobile, setMobile] = useState(false);
  const [signingOut,setSigningOut]=useState(false),[logoutError,setLogoutError]=useState("");
  async function logout(){
    if(signingOut)return;setSigningOut(true);setLogoutError("");
    try{
      if(beforeLogout&&!await beforeLogout())return;
      const response=await fetch("/api/account",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"logout"})});
      if(!response.ok)throw Error("로그아웃하지 못했습니다. 다시 시도해주세요.");
      window.location.assign("/");
    }catch(reason){setLogoutError(reason instanceof Error?reason.message:"로그아웃하지 못했습니다. 다시 시도해주세요.");}
    finally{setSigningOut(false);}
  }
  const destination = member?.role === "supplier" ? "/supplier" : member?.role === "admin" ? "/admin" : "/seller";
  const role = member?.role === "supplier" ? "공급처" : member?.role === "admin" ? "운영자" : "셀러";
  return <div className="fd-app fd-service-shell">
    <div className="fd-topline"><div className="fd-topline-message">산지의 좋은 과일과, 판매의 첫 시작을 잇습니다.<span>FRUIDAM · GROW TOGETHER</span></div><div className="fd-top-account" role="group" aria-label="로그인 계정">{member?<><strong title={member.name}>{member.name}</strong><i aria-hidden="true"/><button type="button" disabled={signingOut} onClick={()=>void logout()}>{signingOut?"로그아웃 중":"로그아웃"}</button></>:<a href="/login" onClick={onNavigate}>로그인</a>}</div></div>
    {logoutError&&<p className="fd-header-logout-error" role="alert">{logoutError}</p>}
    <header className="fd-header">
      <BrandLogo onClick={onNavigate}/>
      <nav id="fruidam-service-menu" className={mobile ? "fd-nav open" : "fd-nav"} aria-label="주 메뉴">
        {links.map(([href, label]) => <a key={href} href={href} className={active === href ? "active" : ""} aria-current={active === href ? "page" : undefined} onClick={onNavigate}>{label}</a>)}
      </nav>
      <div className="fd-header-actions">
        {member ? <>{onNotices && <button aria-label="알림 열기" className="fd-icon" onClick={onNotices}><Bell size={20}/>{unread && <i/>}</button>}<a className="fd-button small" href={destination} onClick={onNavigate}>나의 {role} 공간 <ArrowRight size={15}/></a></> : <>{active === "/" && <a className="fd-button small" href="/login?mode=signup" onClick={onNavigate}>무료로 시작하기 <ArrowRight size={15}/></a>}</>}
        <button className="fd-mobile-menu fd-icon" aria-label="메뉴 열기" aria-expanded={mobile} aria-controls="fruidam-service-menu" onClick={() => setMobile(!mobile)}><Menu size={22}/></button>
      </div>
    </header>
  </div>;
}
