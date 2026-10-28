import { readAsset } from "./asset-store";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

export async function imageInputPart(url:string,size=1200){
  let buffer:Buffer;
  if(/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(url))buffer=await readAsset(path.basename(url));
  else if(["/sample-product.svg","/sample-detail.svg"].includes(url))buffer=await fs.readFile(path.join(process.cwd(),"public",path.basename(url)));
  else throw new Error("등록된 이미지 파일만 참고할 수 있어요.");
  const jpeg=await sharp(buffer,{limitInputPixels:40_000_000}).rotate().resize({width:size,height:size,fit:"inside",withoutEnlargement:true}).jpeg({quality:85}).toBuffer();
  return {inlineData:{mimeType:"image/jpeg",data:jpeg.toString("base64")}};
}
