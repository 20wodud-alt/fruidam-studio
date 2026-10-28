export const fontCatalog = [
  {id:"sans",name:"노토 산스 · 기본 고딕",family:"Noto Sans KR",package:"noto-sans-kr",weights:[400,700]},
  {id:"serif",name:"노토 세리프 · 명조",family:"Noto Serif KR",package:"noto-serif-kr",weights:[400,700]},
  {id:"hand",name:"개구 · 손글씨",family:"Gaegu",package:"gaegu",weights:[400,700]},
  {id:"gowunDodum",name:"고운돋움 · 부드러운 고딕",family:"Gowun Dodum",package:"gowun-dodum",weights:[400]},
  {id:"gowunBatang",name:"고운바탕 · 감성 명조",family:"Gowun Batang",package:"gowun-batang",weights:[400,700]},
  {id:"doHyeon",name:"도현 · 선명한 제목",family:"Do Hyeon",package:"do-hyeon",weights:[400]},
  {id:"blackHan",name:"검은고딕 · 강한 후킹",family:"Black Han Sans",package:"black-han-sans",weights:[400]},
  {id:"jua",name:"주아 · 둥근 제목",family:"Jua",package:"jua",weights:[400]},
  {id:"ibmPlex",name:"IBM 플렉스 · 정돈된 고딕",family:"IBM Plex Sans KR",package:"ibm-plex-sans-kr",weights:[400,700]},
] as const;
export type FontId=typeof fontCatalog[number]["id"];
export const fontIds=fontCatalog.map(font=>font.id);
export const fontFamilies=Object.fromEntries(fontCatalog.map(font=>[font.id,`'${font.family}', sans-serif`])) as Record<FontId,string>;
