import type { Metadata } from "next";
import { CommerceApp } from "@/components/commerce-app";

export const metadata: Metadata = {
  title: "열매담 이야기 — 산지의 정성을, 당신의 일상으로",
  description: "전국 산지 농가·직매장과 셀러를 잇는 열매담. 상세페이지 자동 생성부터 산지 직배송까지, 농업인과 지역사회가 함께 성장하는 온라인 과일 장터를 만들어갑니다.",
};

export default function Page() { return <CommerceApp view="about"/>; }
