import {readAsset, writeAsset, assetMetadataFiles} from "./asset-store";
import path from "node:path";
import type {GeneratedImage,StudioProject} from "./studio";
import {excludedPhotoUrls,projectPhotos,type PhotoAsset} from "./photo-assets";
const valid=/^[a-f0-9-]+\.webp$/;
export async function rememberGeneratedPhoto(image:string,imageMeta:GeneratedImage,name:string,projectId:string){
  const filename=path.basename(image);
  if(!image.startsWith("/api/uploads/") || !valid.test(filename))throw new Error("사진 저장 경로를 확인해주세요.");
  const asset:PhotoAsset={url:image,name:name.slice(0,150),source:"ai",imageMeta,projectId};
  await writeAsset(`${filename}.json`,Buffer.from(JSON.stringify(asset)));
}
export async function readPhotoLibrary(project:StudioProject):Promise<PhotoAsset[]>{
  const assets=new Map(projectPhotos(project).map(asset=>[asset.url,asset]));
  const excluded=excludedPhotoUrls(project);
  let files:string[];
  try{files=(await assetMetadataFiles(project.id)).map(name=>name.slice(0,-5));}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [...assets.values()];throw e;}
  // Only this project's explicit usage or owned AI history qualifies. Legacy
  // files with no owner/usage are never guessed into another project's gallery.
  for(let offset=0;offset<files.length;offset+=40){
    const group=await Promise.all(files.slice(offset,offset+40).map(async filename=>{
      const url=`/api/uploads/${filename}`;
      if(excluded.has(url))return;
      try{
        const meta=JSON.parse((await readAsset(`${filename}.json`)).toString("utf8")) as PhotoAsset;
        if(meta.url===url&&meta.source==="ai"&&meta.imageMeta?.source==="ai"&&(meta.projectId===project.id||assets.has(url)))return {...meta,projectId:project.id};
      }catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT"&&!(e instanceof SyntaxError))throw e;}
      return assets.get(url);
    }));
    group.forEach(asset=>{if(asset)assets.set(asset.url,asset);});
  }
  return [...assets.values()];
}
