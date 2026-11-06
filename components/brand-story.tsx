/* eslint-disable @next/next/no-img-element */
import { ArrowDown, ArrowRight, CircleCheck, HandHeart, Handshake, Leaf, MapPin, PackageCheck, ShoppingBasket, Sparkles, Sprout, Store, Truck } from "lucide-react";
import "@/app/brand-story.css";
import { BrandCover, brandCoverStyles } from "./brand-cover";

const values = [
  { number: "01", icon: <Sprout/>, title: "농업인의 정성이 제값을 받도록", body: "좋은 과일을 기르는 일에 집중할 수 있도록, 산지의 상품과 이야기가 온라인에서도 새로운 고객을 만나게 돕습니다." },
  { number: "02", icon: <Handshake/>, title: "지역의 좋은 이웃이 함께 자라도록", body: "농가와 지역 직매장, 판매자를 연결합니다. 지역에서 시작한 좋은 결실이 더 넓은 시장으로 이어지는 길을 만듭니다." },
  { number: "03", icon: <HandHeart/>, title: "정직한 가격으로 일상이 행복하도록", body: "산지와 상품 정보를 바탕으로 선택하고, 가격과 배송 조건을 확인할 수 있도록. 믿고 사고 싶은 온라인 장터를 지향합니다." },
];
const journey = [
  { icon: <Store/>, title: "산지의 좋은 과일을 만납니다", body: "농가·직매장이 상품과 실제 사진, 원산지, 수확·출고 정보를 등록합니다.", tag: "농가 · 직매장" },
  { icon: <Sparkles/>, title: "과일의 이야기를 담습니다", body: "농가와 셀러는 등록한 상품 정보로 상세페이지 구성안을 자동 생성하고 직접 다듬습니다.", tag: "상세페이지 자동 생성" },
  { icon: <ShoppingBasket/>, title: "온라인에서 고객과 만납니다", body: "셀러가 자신의 판매 채널에 상품을 소개하고, 접수한 고객 주문을 열매담에 발주합니다.", tag: "셀러의 판매 채널" },
  { icon: <Truck/>, title: "산지에서 고객에게 보냅니다", body: "확정된 발주를 바탕으로 공급처가 포장과 출고를 맡아 고객에게 직접 배송합니다.", tag: "산지 직배송" },
];

export function BrandStory() {
  return <main className="fd-story">
    <style>{brandCoverStyles}</style>
    <section className="fs-hero" aria-labelledby="story-title">
      <img className="fs-hero-image" src="/photos/fruidam-harvest-story.webp" alt="햇살이 비치는 사과 과수원에서 수확한 사과를 나무 상자에 담아 든 모습" fetchPriority="high" width={1600} height={900}/>
      <div className="fs-hero-shade"/>
      <div className="fs-hero-inner fd-container">
        <div className="fs-hero-top"><span>OUR STORY</span><span>땅에서 시작해, 사람에게 닿는 이야기</span></div>
        <span className="fs-kicker"><Leaf size={16}/> 열매담이 잇는 좋은 인연</span>
        <h1 id="story-title">산지의 정성을,<br/>당신의 일상으로.</h1>
        <p>잘 기른 과일 하나에 담긴 마음까지.<br/>농가와 지역, 판매자와 고객이 함께 웃는<br className="fs-mobile-break"/> 신선한 연결을 만듭니다.</p>
        <a href="#our-belief" className="fs-read-story">열매담 이야기 만나보기 <ArrowDown size={17}/></a>
      </div>
      <span className="fs-photo-note">브랜드 소개를 위한 AI 연출 이미지</span>
    </section>

    <nav className="fs-section-nav" aria-label="열매담 이야기 목차"><a href="#our-belief">우리가 담은 마음</a><a href="#our-values">함께 자라는 가치</a><a href="#our-journey">신선함이 닿는 여정</a><a href="#grow-together">열매담과 함께하기 <ArrowRight size={14}/></a></nav>

    <section className="fs-brand-identity" aria-labelledby="brand-identity-title">
      <div className="fd-container fs-brand-layout">
        <div className="fs-brand-manifesto"><span className="fs-eyebrow">OUR BRAND PROMISE</span><h2 id="brand-identity-title">농부가 키운 계절을,<br/>당신의 일상에 담습니다.</h2><p className="fs-brand-lead">좋은 과일의 시작은 산지에 있습니다.<br/>그 가치를 온전히 전하는 일이 열매담의 역할입니다.</p><p>전국의 산지 농가와 직매장이 정성껏 기른 과일을 온라인으로 연결합니다. 농가는 재배와 출고에 집중하고, 셀러는 상품의 이야기를 담은 상세페이지로 고객을 만납니다. 공급처에서 직접 보내는 과일이 더 많은 식탁의 기쁨이 되도록 함께합니다.</p><div className="fs-brand-principles"><span><b>산지를 담다</b>누가, 어디에서 기른 과일인지</span><span><b>정직함을 담다</b>상품과 가격, 배송 조건을 투명하게</span><span><b>함께 자라다</b>농가와 지역, 셀러와 고객이 함께</span></div><a href="/studio" className="fs-brand-cta">열매담의 이름으로, 나의 판매 시작하기 <ArrowRight size={16}/></a></div>
        <div className="fs-brand-preview"><BrandCover/><p>셀러의 상품 상세페이지 맨 앞에 함께하는 열매담 공통 브랜드 표지</p></div>
      </div>
    </section>

    <section id="our-belief" className="fs-intro fd-container fs-section">
      <div><span className="fs-eyebrow">ROOTED IN CARE</span><h2>좋은 과일은<br/>좋은 연결에서<br/><em>더 큰 결실이 됩니다.</em></h2></div>
      <div className="fs-intro-copy"><span className="fs-small-leaf"><Sprout size={32}/></span><p className="fs-lead">농부가 정성껏 키운 과일이<br/>제 가치를 아는 사람에게 닿는 것.<br/>열매담은 그 당연한 바람에서 시작합니다.</p><p>전국 지역의 산지 농가·직매장과 셀러가 만나는 온라인 장터. 상품을 소개하는 상세페이지 제작은 쉽게, 고객에게 전하는 배송은 산지에서 직접. 열매담은 좋은 과일이 온라인으로 향하는 길을 함께 만듭니다.</p><p>농업인에게는 새로운 판매의 기회를, 지역에는 함께 성장할 힘을, 소비자에게는 정직한 가격으로 고르는 기쁨을 전하고 싶습니다.</p><span className="fs-signature">정성을 담고, 인연을 잇다. <strong>열매담</strong></span></div>
    </section>

    <section id="our-values" className="fs-values">
      <div className="fd-container fs-section"><div className="fs-section-heading"><span className="fs-eyebrow">GOOD FRUIT, SHARED GOOD</span><h2>한 알의 결실이,<br/>모두의 기쁨이 되도록.</h2><p>열매담이 지켜가고 싶은 세 가지 마음입니다.</p></div><div className="fs-values-grid">{values.map(value => <article key={value.number}><div className="fs-value-top"><span>{value.number}</span>{value.icon}</div><h3>{value.title}</h3><p>{value.body}</p></article>)}</div></div>
    </section>

    <section className="fs-origin fd-container fs-section">
      <figure><img src="/photos/fruit-orchard.webp" alt="햇살 아래 감귤이 열려 있는 제주 과수원 가지" width={1000} height={1100}/><figcaption><MapPin size={13}/> 계절의 맛이 시작되는 곳, 우리의 산지</figcaption><div className="fs-photo-seal"><Leaf size={25}/><span>GROWN WITH CARE<br/>SHARED WITH YOU</span></div></figure>
      <div className="fs-origin-copy"><span className="fs-eyebrow">CLOSER TO THE ORIGIN</span><h2>가까이 잇습니다.<br/><em>신선함도, 마음도.</em></h2><p>갓 수확한 과일의 신선함을 고객에게 전하고 싶다는 마음. 그 마음이 이어지도록 상품의 정보부터 포장과 출고까지, 각자의 역할을 한곳에서 연결합니다.</p><div className="fs-origin-points"><article><span><MapPin size={21}/></span><div><h3>어디에서 왔는지 알 수 있게</h3><p>원산지와 공급처, 품종과 상품 정보를 담습니다.</p></div></article><article><span><PackageCheck size={21}/></span><div><h3>산지에서 포장하고 직접 보내도록</h3><p>셀러의 주문을 산지 공급처의 출고와 연결합니다.</p></div></article><article><span><CircleCheck size={21}/></span><div><h3>가격과 조건을 미리 확인하도록</h3><p>공급가·옵션·지역별 추가 배송비를 함께 안내합니다.</p></div></article></div></div>
    </section>

    <section id="our-journey" className="fs-journey"><div className="fd-container fs-section"><div className="fs-section-heading"><span className="fs-eyebrow">FROM FARM TO EVERYDAY</span><h2>과수원에서 시작된 정성,<br/>온라인을 지나 고객에게.</h2><p>기르는 사람, 전하는 사람, 기다리는 사람을 잇는 여정.</p></div><ol className="fs-journey-grid">{journey.map((step,index) => <li key={step.tag}><div className="fs-journey-line"><span>0{index+1}</span><ArrowRight size={18}/></div><div className="fs-journey-icon">{step.icon}</div><span className="fs-step-tag">{step.tag}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol><div className="fs-journey-note"><Leaf size={17}/><p>상품 소개에는 실제 상품 정보를 사용합니다. 수확·출고 일정과 배송 조건은 상품별 안내를 확인해주세요.</p></div></div></section>

    <section id="grow-together" className="fs-together"><div className="fd-container fs-section"><span className="fs-eyebrow">LET’S GROW TOGETHER</span><Sprout className="fs-together-sprout" size={44}/><h2>당신의 정성이,<br/>더 멀리 닿도록.</h2><p>좋은 과일을 키우고 계신가요?<br/>좋은 상품을 전할 기회를 찾고 계신가요?<br/>열매담에서 새로운 인연을 시작하세요.</p><div className="fs-together-actions"><a href="/login?mode=signup&role=supplier" className="fd-button">농가·직매장 입점 신청 <ArrowRight size={17}/></a><a href="/catalog" className="fd-button outline">판매할 과일 둘러보기 <ArrowRight size={17}/></a></div><span className="fs-together-foot">입점과 상품은 운영자 검토·승인 후 공개됩니다.</span></div></section>
  </main>;
}
