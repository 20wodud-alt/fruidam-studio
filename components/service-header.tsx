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

export function ServiceHeader({ active, member, unread = false, onNotices, onNavigate }: {
  active: string; member?: Member | null; unread?: boolean; onNotices?: () => void;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const [mobile, setMobile] = useState(false);
  const destination = member?.role === "supplier" ? "/supplier" : member?.role === "admin" ? "/admin" : "/seller";
  const role = member?.role === "supplier" ? "공급처" : member?.role === "admin" ? "운영자" : "셀러";
  return <div className="fd-app fd-service-shell">
    <div className="fd-topline">산지의 좋은 과일과, 판매의 첫 시작을 잇습니다.<span>FRUIDAM · GROW TOGETHER</span></div>
    <header className="fd-header">
      <BrandLogo onClick={onNavigate}/>
      <nav id="fruidam-service-menu" className={mobile ? "fd-nav open" : "fd-nav"} aria-label="주 메뉴">
        {links.map(([href, label]) => <a key={href} href={href} className={active === href ? "active" : ""} aria-current={active === href ? "page" : undefined} onClick={onNavigate}>{label}</a>)}
      </nav>
      <div className="fd-header-actions">
        {member ? <>{onNotices && <button aria-label="알림 열기" className="fd-icon" onClick={onNotices}><Bell size={20}/>{unread && <i/>}</button>}<a className="fd-button small" href={destination} onClick={onNavigate}>나의 {role} 공간 <ArrowRight size={15}/></a></> : <><a className="fd-login-link" href="/login" onClick={onNavigate}>로그인</a><a className="fd-button small" href="/login?mode=signup" onClick={onNavigate}>무료로 시작하기 <ArrowRight size={15}/></a></>}
        <button className="fd-mobile-menu fd-icon" aria-label="메뉴 열기" aria-expanded={mobile} aria-controls="fruidam-service-menu" onClick={() => setMobile(!mobile)}><Menu size={22}/></button>
      </div>
    </header>
  </div>;
}
