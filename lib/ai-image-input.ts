import { readAsset } from "./asset-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { sampleImageFile } from "./sample-photos";

export async function imageInputPart(url:string,size=1200){
  if(!Number.isSafeInteger(size)||size<1||size>4096)throw new Error("참고 사진의 처리 크기를 확인해주세요. 원본 사진은 유지됩니다.");
  let buffer:Buffer;
  if(/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(url))buffer=await readAsset(path.basename(url));
  else if(sampleImageFile(url))buffer=await fs.readFile(path.join(process.cwd(),"public",sampleImageFile(url)!));
  else throw new Error("등록된 이미지 파일만 참고할 수 있어요.");
  const jpeg=await sharp(buffer,{limitInputPixels:40_000_000}).rotate().resize({width:size,height:size,fit:"inside",withoutEnlargement:true}).jpeg({quality:85}).toBuffer();
  return {inlineData:{mimeType:"image/jpeg",data:jpeg.toString("base64")}};
}
