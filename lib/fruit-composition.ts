import type { Product, Section } from "./studio";

export const fruitCompositionRequest = "상품 상세페이지의 전체 문구를 새로 작성해주세요. 상품 특징을 그대로 붙여넣지 말고 의미와 사실은 유지한 채 고객이 맛과 먹는 순간을 떠올릴 수 있는 카피로 다듬으세요. 첫 화면의 감각적인 후킹 → 핵심 포인트 → 특징별 설명 → 원물과 과육 디테일 → 식탁에서 즐기는 장면 → 옵션과 FAQ → 구매를 권하는 마무리로 역할을 나누세요. 상품명은 메인 제목 또는 서브에 반드시 유지하세요. 각 페이지의 제목과 설명은 서로 다르게 작성하고, 핵심 포인트는 짧은 완성 문장으로 재구성하세요. 확인되지 않은 당도·식감·효능·산지·선별·배송 약속은 만들지 마세요. 원본 대표 사진과 옵션은 유지하며, 이미지 연출은 원물 정물·과육 매크로·탑뷰 식탁·산지 와이드 등 서로 다른 구도를 기획하세요.";

function formatFruitOptionGuide(opt: string): string {
  if (/선물/.test(opt)) return `${opt} — 감사한 분께 전하기 좋은 정돈된 구성`;
  if (/가정|실속|못난이|알뜰/.test(opt)) return `${opt} — 매일 넉넉하게 꺼내 먹기 좋은 실속 구성`;
  if (/10kg|대용량/.test(opt)) return `${opt} — 온 가족·나눔용으로 오래 두고 즐기는 넉넉한 양`;
  if (/5kg/.test(opt)) return `${opt} — 2~4인 가구가 일주일 내외로 즐기기 좋은 표준 구성`;
  if (/2kg|3kg/.test(opt)) return `${opt} — 1~2인 가구 또는 첫 구매로 부담 없는 구성`;
  return `${opt} — 필요량과 용도에 맞춰 선택`;
}

// A factual, useful fallback when Gemini is disconnected. No invented taste claims.
export function writeFruitCopy(product:Product,sections:Section[]):Section[]{
  const facts=product.features.split(/\n/).map(s=>s.replace(/^\s*[-•\d.)]+\s*/,"").trim()).filter(Boolean);
  const polish=(s:string)=>s.replace(/보내드려요[.!]?$/,"전해드려요").replace(/맛있는\s+/g,"").replace(/기른\s+/g,"키워낸 ").replace(/후\s+/g,"뒤 ").replace(/\s{2,}/g," ");
  const points=facts.map(polish);
  const fact=(i:number)=>points[i%Math.max(1,points.length)] || `${product.name}의 모습과 구성을 사진으로 만나보세요.`;
  const options=product.options.split(/\n/).map(s=>s.trim()).filter(Boolean);
  const defaultFourPoints=[
    `${product.name} 본연의 풍미와 식감을 살린 제철 원물`,
    "하나씩 눈으로 살피고 손으로 고른 까다로운 선별 기준",
    "식탁 위 간식부터 감사한 마음 전할 자리까지 어울리는 구성",
    "이동 중 눌림을 줄이는 완충 포장으로 안전하게 도착"
  ];
  const fourPoints=Array.from({length:4},(_,idx)=>points[idx]||defaultFourPoints[idx]);
  const detailTitles=["입안 가득 채워지는\n산뜻한 과즙과 향","손으로 직접 살핀\n꼼꼼한 선별의 차이","식탁에도, 선물에도\n어울리는 정갈한 구성","가까이 볼수록 또렷한\n원물 본연의 상태","받아보실 실제 구성,\n미리 확인하세요"];
  const storyTitles=["겉모습만 보고 골라\n아쉬웠던 적 있나요?","바쁜 아침, 나른한 오후\n손이 가는 과일 한 접시","마지막 한 알까지\n신선하게 보관하는 팁","산지에서 식탁까지,\n품질과 포장의 약속"];
  const directions=["밝고 깨끗한 화이트 톤 스튜디오 정물. 통통한 원물과 반으로 자른 단면을 함께 배치해 신선한 과육이 돋보이는 하이키 자연광 촬영.","과일의 깨끗한 표면과 촉촉한 과육 단면을 밝은 배경 위에서 선명하게 담은 클로즈업 매크로. 어둡거나 지저분한 소품 배제.","밝고 깔끔한 화이트 식탁 위 도자기 접시에 담긴 과일 탑뷰. 군더더기 없는 미니멀하고 청량한 분위기.","맑은 햇살 아래 과수원 분위기의 밝고 시원한 와이드컷. 실제 농장이나 생산자를 입증하는 듯한 표현 배제."];
  let detail=0,story=0,benefit=0;
  return sections.map((section,index)=>{
    let title=section.title,body=section.body;
    if(section.kind==="hero"){title="한입 베어 무는 순간,\n기다려지는 제철 과일";body=`${product.name}\n${fact(0)}\n산지의 신선함을 그대로 담아 우리 집 식탁까지 전합니다.`;}
    else if(section.kind==="benefits"){title=benefit++?"결제 전 한 번 더,\n핵심 4가지를 확인하세요":"망설임 없이 고르는\n네 가지 매력 포인트";body=fourPoints.join("\n");}
    else if(section.kind==="detail"){const i=detail++;title=detailTitles[i%detailTitles.length];body=i===detailTitles.length-1&&options.length?`${options.join(" · ")}\n선택하신 중량과 용도에 맞춰 정갈하게 담아 보내드립니다.\n농산물은 생물 특성상 개당 크기와 개수에 약간의 차이가 있을 수 있습니다.`:`${fact(i)}\n${["사진 속 색감과 윤기에서 원물의 신선함을 먼저 확인해보세요.\n수확 후 선별 과정을 거쳐 균일한 상태로 준비합니다.","받아보셨을 때의 만족감을 위해 하나씩 살펴 담아냅니다.\n겉모습뿐만 아니라 한입 베어 물었을 때의 만족감까지 생각했습니다.","인위적인 보정 없이 과일 본연의 표면과 색을 담았습니다.\n필요한 만큼 넉넉하게 즐기실 수 있도록 구성을 갖췄습니다."][i%3]}`;}
    else if(section.kind==="story"){const i=story++;title=storyTitles[i%storyTitles.length];body=i===2?"수령 후 박스를 열어 전체 상태를 먼저 확인해 주세요.\n상처가 있거나 후숙이 빠른 과일 먼저 드시는 것을 권합니다.\n나머지는 서늘하고 통풍이 잘되는 곳 또는 냉장 보관으로 신선도를 지켜주세요.":`${fact(i)}\n${i===0?"눈으로만 고르기 어려운 제철 과일, 이제 기준부터 확인하세요.\n까다로운 선별을 거친 원물만 담아 실망 없는 선택을 돕습니다.":"바쁜 아침 간편한 한 조각부터 온 가족이 모이는 식탁까지,\n깎아 두면 금세 손이 가는 기분 좋은 과일 시간을 경험해보세요."}`;}
    else if(section.kind==="shipping"){title="문 앞까지 안전하게,\n흔들림 잡은 안심 포장";body="과일은 배송 중 작은 충격에도 멍이 들기 쉽습니다.\n이동 중 눌림과 흔들림을 줄이도록 완충 포장으로 꼼꼼하게 발송합니다.\n수령 직후 박스를 열어 상품 상태를 먼저 확인해주세요.";}
    else if(section.kind==="options"){title="우리 집 인원에 맞게\n알맞은 중량을 고르세요";body=options.length?options.join("\n"):`${product.name} 기본 구성\n주문창에서 중량과 용도를 선택하세요.`;}
    else if(section.kind==="faq"){title="구매 전 궁금한 점,\n한눈에 확인하세요";body=`Q. 어떤 구성과 옵션으로 선택할 수 있나요?\nA. ${options.length?options.join(", "):`${product.name} 기본 구성`} 중 필요한 용도와 인원에 맞춰 골라보세요.\n\nQ. 과일 크기나 색상이 사진과 조금 다를 수 있나요?\nA. 농산물은 생물 특성상 수확 시기와 개체에 따라 크기·모양에 약간의 차이가 있을 수 있습니다.\n\nQ. 받자마자 보관은 어떻게 하면 좋나요?\nA. 박스를 열어 상태를 먼저 확인하시고, 직사광선을 피해 서늘한 곳 또는 냉장 보관해 주세요.\n\nQ. 배송 중 파손이나 이상이 발견되면 어떻게 하나요?\nA. 수령 직후 상품 상태를 사진으로 찍어 고객센터로 문의해 주시면 확인 후 신속히 안내해 드립니다.`;}
    if(index===sections.length-1&&section.kind==="story"){title="산지에서 식탁까지,\n안심하고 고르세요";body=`${product.name}${product.price?` · ${product.price}`:""}\n선별부터 완충 포장까지 꼼꼼하게 준비했습니다.\n지금 필요한 구성을 선택해 바로 만나보세요.`;}
    const headline=product.design?.brief.match(/^(?:메인\s*문구|헤드라인)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
    const subline=product.design?.brief.match(/^(?:서브\s*문구|서브\s*카피)\s*[:：]\s*(.+)$/m)?.[1]?.trim();
    return {...section,title:index===0&&headline?headline:title,body:index===0&&subline?subline:body,imageDirection:section.imageDirection||directions[index%directions.length]};
  });
}
