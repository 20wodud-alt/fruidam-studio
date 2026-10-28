import type { GeneratedImage, StudioProject } from "./studio";
export type PhotoAsset={url:string;name:string;source:"upload"|"ai"|"reference"|"stored";imageMeta?:GeneratedImage;projectId?:string};
export function excludedPhotoUrls(project:StudioProject){
  return new Set([...(project.product.design?.references || []),project.product.design?.reviewImage].filter(Boolean));
}
export function projectPhotos(project:StudioProject):PhotoAsset[]{
  const photos=new Map<string,PhotoAsset>();
  const excluded=excludedPhotoUrls(project);
  const add=(url:string|undefined,source:PhotoAsset["source"],imageMeta?:GeneratedImage)=>{
    if(!url || excluded.has(url))return;
    const previous=photos.get(url);
    if(!previous || imageMeta)photos.set(url,{url,projectId:project.id,source:previous?.source==="ai"?"ai":source,name:imageMeta?"AI 생성 사진":previous?.name || "업로드 사진",imageMeta:imageMeta || previous?.imageMeta});
  };
  project.product.images.forEach(url=>add(url,"upload"));
  project.sections.forEach(section=>{add(section.image,section.imageMeta?"ai":"stored",section.imageMeta);add(section.imageMeta?.originalImage,"upload");section.elements?.filter(e=>e.type==="image").forEach(e=>add(e.image,"stored"));});
  return [...photos.values()];
}
