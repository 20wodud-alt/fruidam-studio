// Text generation models, grouped by their intended use rather than billing promises.
export const geminiModelGroups = [
  {label:"경제형 · 가볍고 빠른 작성",models:[
    {id:"gemini-3.5-flash-lite",name:"Gemini 3.5 Flash-Lite",description:"빠른 초안과 반복 문구 작업에 적합해요."},
    {id:"gemini-3.1-flash-lite",name:"Gemini 3.1 Flash-Lite",description:"짧은 문구를 빠르게 다듬을 때 선택해보세요."},
  ]},
  {label:"균형형 · 일상적인 상세페이지 작성",models:[
    {id:"gemini-3.8-flash",name:"Gemini 3.8 Flash · 추천",description:"속도와 작성 품질을 함께 고려한 기본 모델이에요."},
    {id:"gemini-3.6-flash",name:"Gemini 3.6 Flash",description:"일반적인 상품 설명과 리뷰 요약에 사용할 수 있어요."},
  ]},
  {label:"고급형 · 복잡한 기획과 검토",models:[
    {id:"gemini-4-argon",name:"Gemini 4 Argon",description:"복잡한 기획과 여러 조건을 반영하는 작업에 선택해보세요."},
    {id:"gemini-3.1-pro-preview",name:"Gemini 3.1 Pro · 미리보기",description:"고급 추론용 미리보기 모델로, 제공 상태가 달라질 수 있어요."},
  ]},
] as const;
export const geminiModels = geminiModelGroups.flatMap(group=>[...group.models]);
