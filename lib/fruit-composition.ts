import type { Product, Section } from "./studio";

export const fruitCompositionRequest = "상품 상세페이지의 전체 문구를 새로 작성해주세요. 상품 특징을 그대로 붙여넣지 말고 의미와 사실은 유지한 채 고객이 맛과 먹는 순간을 떠올릴 수 있는 카피로 다듬으세요. 첫 화면의 감각적인 후킹 → 핵심 포인트 → 특징별 설명 → 원물과 과육 디테일 → 식탁에서 즐기는 장면 → 옵션과 FAQ → 구매를 권하는 마무리로 역할을 나누세요. 상품명은 메인 제목 또는 서브에 반드시 유지하세요. 각 페이지의 제목과 설명은 서로 다르게 작성하고, 핵심 포인트는 짧은 완성 문장으로 재구성하세요. 확인되지 않은 당도·식감·효능·산지·선별·배송 약속은 만들지 마세요. 원본 대표 사진과 옵션은 유지하며, 이미지 연출은 원물 정물·과육 매크로·탑뷰 식탁·산지 와이드 등 서로 다른 구도를 기획하세요.";

// A factual, useful fallback when Gemini is disconnected. No invented taste claims.
export function writeFruitCopy(product:Product,sections:Section[]):Section[]{
  const facts=product.features.split(/\n/).map(s=>s.replace(/^\s*[-•\d.)]+\s*/,"").trim()).filter(Boolean);
  const polish=(s:string)=>s.replace(/보내드려요[.!]?$/,"전해드려요").replace(/맛있는\s+/g,"").replace(/기른\s+/g,"키워낸 ").replace(/후\s+/g,"뒤 ").replace(/\s{2,}/g," ");
  const points=facts.map(polish);
  const fact=(i:number)=>points[i%Math.max(1,points.length)] || `${product.name}의 모습과 구성을 사진으로 만나보세요.`;
  const detailTitles=["한입을 기다리는\n기분 좋은 순간","가까이 볼수록\n궁금해지는 한 조각","취향을 채우는\n과일의 작은 차이","한 접시에 담아\n천천히 즐겨보세요","과일의 표정을\n조금 더 가까이","함께 나눌 만큼,\n알맞게 담아보세요"];
  const storyTitles=["과일 하나에 담긴\n이야기를 만나요","오늘의 식탁에\n과일 한 접시","바쁜 하루 사이,\n나를 위한 과일 시간","좋아하는 사람과\n함께 나누는 즐거움"];
  const directions=["원본 과일의 모양과 색을 유지한 풍성한 원물 정물. 사선 45도 구도와 측면 자연광, 소박한 도자기 접시.","과일의 실제 표면과 과육을 보여주는 타이트한 매크로. 원본 품종과 숙도를 유지하고 인위적인 광택과 물방울은 피합니다.","밝은 식탁 위 과일 한 접시를 내려다보는 탑뷰. 리넨과 작은 접시를 활용하고 가상의 성인 손은 사람 허용 시에만 포함합니다.","원본 과일에 적합한 익명의 산지 분위기 와이드컷. 실제 농장이나 생산자를 입증하는 사진처럼 표현하지 않습니다."];
  let detail=0,story=0,benefit=0;
  return sections.map((section,index)=>{
    let title=section.title,body=section.body;
    if(section.kind==="hero"){title="오늘, 과일 한입이\n기다려지는 이유";body=`${product.name}\n${fact(0)}`;}
    else if(section.kind==="benefits"){title=benefit++?"한 번 더 떠올리는\n이 과일의 매력":"고르는 이유는\n이렇게 또렷하게";body=points.length?points.join("\n"):fact(0);}
    else if(section.kind==="detail"){const i=detail++;title=detailTitles[i%detailTitles.length];body=`${fact(i)}\n${["사진 속 색과 형태를 살펴보며 한입을 상상해보세요.","나에게 맞는 크기와 구성은 옵션에서 골라보세요.","과일이 있는 식탁, 오늘의 작은 즐거움을 준비해보세요."][i%3]}`;}
    else if(section.kind==="story"){const i=story++;title=storyTitles[i%storyTitles.length];body=`${fact(i)}\n${i%2?"한 접시에 담아 나누는 시간을 떠올려보세요.":"매일의 과일 시간을 취향에 맞게 채워보세요."}`;}
    if(index===sections.length-1&&section.kind==="story"){title="오늘의 과일 시간,\n지금 골라보세요";body=`${product.name}\n필요한 만큼 골라 함께 즐겨보세요.`;}
    const headline=product.design?.brief.match(/^(?:메인\s*문구|헤드라인)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
    const subline=product.design?.brief.match(/^(?:서브\s*문구|서브\s*카피)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
    return {...section,title:index===0&&headline?headline:title,body:index===0&&subline?subline:body,imageDirection:section.imageDirection||directions[index%directions.length]};
  });
}
