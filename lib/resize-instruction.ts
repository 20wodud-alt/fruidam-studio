export type ResizeInstruction={type:"resize";subject:"photo"|"selection";factor?:number;deltaPx?:number;widthPx?:number;heightPx?:number;widthPercent?:number;heightPercent?:number;axis:"both"|"width"|"height"};
export function parseResizeInstruction(input:string):ResizeInstruction|null{
  const photo=/사진|이미지/.test(input);
  if(/제목|본문|글씨|글자|텍스트|카피|첨부|참고|교체|새로|생성|연출|이동|옮겨|복제|삭제|밝기|대비|채도|불투명|반전|회전|정렬|배경|테마/.test(input))return null;
  const resize=/키워|키우|크게|커지|확대|늘려|넓혀|줄여|줄이|작게|축소|좁혀|절반|배로/.test(input);
  const dimensions=[...input.matchAll(/(가로|너비|폭|세로|높이)(?:를|을|는|은)?\s*(\d{1,4}(?:\.\d+)?)\s*(px|픽셀|%)?/gi)];
  if(!resize&&!dimensions.length)return null;
  if(!photo&&!dimensions.length&&!/^(?:(?:이거|이것|선택한\s*(?:요소|것)|좀|더)\s*)*(?:키워|크게|확대|늘려|줄여|작게|축소|절반)/.test(input))return null;
  const width=/가로|너비|폭/.test(input),height=/세로|높이/.test(input),axis=width&&!height?"width":height&&!width?"height":"both";
  const result:ResizeInstruction={type:"resize",subject:photo?"photo":"selection",axis};
  const smaller=/줄여|줄이|작게|축소|좁혀|절반/.test(input),delta=input.match(/(\d{1,4})\s*(?:px|픽셀)\s*(?:만큼|씩)/i);
  if(delta)return {...result,deltaPx:Number(delta[1])*(smaller?-1:1)};
  if(dimensions.length){for(const m of dimensions){const w=/가로|너비|폭/.test(m[1]),n=Number(m[2]);if(n<=0)return null;if(m[3]==="%"||(!m[3]&&w&&n<=100))result[w?"widthPercent":"heightPercent"]=n;else result[w?"widthPx":"heightPx"]=n;}return result;}
  const multiplier=input.match(/(\d+(?:\.\d+)?)\s*배/),percent=input.match(/(\d+(?:\.\d+)?)\s*%/),pixels=input.match(/(\d{2,4})\s*(?:px|픽셀)(?:로|으로)/i);
  if(pixels)return {...result,...(axis==="height"?{heightPx:Number(pixels[1])}:{widthPx:Number(pixels[1])})};
  if(multiplier)result.factor=Number(multiplier[1]);
  else if(/두\s*배/.test(input))result.factor=2;
  else if(/절반|반으로/.test(input))result.factor=.5;
  else if(percent){const n=Number(percent[1])/100;result.factor=/%\s*(?:로|크기로)/.test(input)?n:smaller?1-n:1+n;}
  else result.factor=smaller?.85:1.15;
  return result.factor>0&&result.factor<=10?result:null;
}
