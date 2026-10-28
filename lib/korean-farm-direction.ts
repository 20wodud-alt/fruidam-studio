// One reusable direction for new projects and regeneration of existing images.
export const koreanFarmerCopyDirection = "인물이 있는 농작업 컷은 가상의 한국인 성인 농부를 기본으로 하고, 수확철에 맞는 긴팔 작업복·조끼·작업 바지·햇빛 가림 모자·작업 장갑·장화 중 장면에 필요한 복장을 구체적으로 기획하세요. 정면 광고 포즈보다 수확·살피기·선별에 집중한 자세를 사용하고 남녀·연령을 자연스럽게 다양화하세요. 수입산을 국내 재배로 표현하거나 가상 인물을 실제 생산자로 소개하지 마세요.";

export function koreanFarmPhotoDirection(people:boolean,imported:boolean){
  const setting=imported
    ? "The product is described as imported: do not depict it growing or being harvested in Korea. Use an unbranded packing/inspection work area or neutral product setting; this overrides any orchard/harvest direction above. Korean casting never establishes Korean origin."
    : "Use a plausible contemporary Korean agricultural work setting appropriate to the actual crop: orchard rows with practical supports, a modest sorting work area and unbranded harvest crates where relevant. Do not invent the actual farm, producer or location.";
  if(!people)return `${setting} No people, faces, bodies or hands; communicate the agricultural atmosphere through the crop, light and appropriate work setting only.`;
  return `Default human casting for agricultural scenes: a fictional Korean adult farmer, naturally varied men and women around 30–60, believable skin texture and a relaxed, focused expression. Never copy a person from references or identify the figure as the real grower. Unless the user's explicit casting direction says otherwise, prefer this Korean farm-worker context over a generic fashion model.
Wardrobe must be functional for the crop, task and harvest season: practical long-sleeved cotton/work shirt or breathable field jacket, optional plain work vest, durable work trousers, wide-brim sun hat or visor with neck protection, fitted work gloves and practical rubber/work boots as appropriate. Use restrained navy, olive, grey or muted checks, subtly worn but clean clothing. Do not combine every accessory mechanically. Clean suitable gloves for sorting; no exaggerated dirt on food or clothing.
Capture candid inspection, gentle harvesting or sorting rather than a front-facing sales pose. Keep the fruit dominant; hands, grip and tools must be anatomically plausible. Avoid cowboy hats, ranch styling, western barns, costume hanbok, luxury fashion and caricatures. ${setting}`;
}

export function isImportedProduce(name:string,features:string){
  return /수입산|수입\s*과일|(?:태국|베트남|필리핀|페루|미국|뉴질랜드|칠레|호주|남아공|중국|일본|멕시코|에콰도르|콜롬비아)\s*(?:산|직수입)|imported/i.test(`${name}\n${features}`);
}
