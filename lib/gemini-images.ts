import { writeAsset } from "./asset-store";
import { imageInputPart } from "./ai-image-input";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { readAISettings } from "./ai-settings";
import { geminiError } from "./gemini-client";
import { buildImagePrompt, defaultImageModel, type ImageScene } from "./image-plan";
import type { Product, Section } from "./studio";
const referencePart = imageInputPart;
export async function generateSectionImage(product:Product,section:Section,scene:ImageScene,custom:string,signal?:AbortSignal){
  const settings=await readAISettings();if(!settings.apiKey || !settings.enabled)throw new Error("Gemini API를 먼저 연결하고 AI 사용을 켜주세요. 문구와 원본 사진은 그대로 유지됩니다.");
  if(!product.images.length)throw new Error("기준으로 사용할 상품 사진을 먼저 올려주세요.");
  const model=settings.imageModel || defaultImageModel;const prompt=buildImagePrompt(product,section,scene,custom);
  const references=await Promise.all(product.images.slice(0,2).map(referencePart));
  const styleUrl=product.design?.references?.find(url=>!product.images.slice(0,2).includes(url));
  const styleParts=styleUrl ? [{text:"The following image is a STYLE reference only. Borrow only broad lighting, palette and framing. It does NOT define the product, farm, people, factual claims or packaging. Do not copy its exact photograph, text, brand, layout or identity."},await referencePart(styleUrl)] : [];
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":settings.apiKey},signal:AbortSignal.any([AbortSignal.timeout(120000),...(signal ? [signal] : [])]),body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},...references,...styleParts]}],generationConfig:{responseModalities:["TEXT","IMAGE"],imageConfig:{aspectRatio:"3:4",imageSize:"1K"}}})});
  const data=await response.json();if(!response.ok)throw new Error(geminiError(response.status,data.error?.status,data.error?.details?.find((d:{reason?:string})=>d.reason)?.reason));
  const candidate=data.candidates?.[0];if(data.promptFeedback?.blockReason || candidate?.finishReason==="SAFETY")throw new Error("이미지 생성이 안전 필터로 중단됐어요. 연출 방향을 바꿔 다시 시도해주세요.");
  const part=candidate?.content?.parts?.find((p:{thought?:boolean;inlineData?:{mimeType?:string;data?:string}})=>!p.thought && p.inlineData?.mimeType?.startsWith("image/") && p.inlineData?.data);
  const encoded=part?.inlineData?.data;if(typeof encoded!=="string" || encoded.length>40_000_000)throw new Error("생성된 이미지 응답을 확인하지 못했어요. 이미지 전용 모델과 사용 권한을 확인해주세요.");
  const bytes=Buffer.from(encoded,"base64");if(!bytes.length)throw new Error("이미지 응답이 비어 있어요.");
  const output=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize({width:1800,height:2400,fit:"inside",withoutEnlargement:true}).webp({quality:90}).toBuffer();
  const name=`${randomUUID()}.webp`;await writeAsset(name,output);
  return {image:`/api/uploads/${name}`,imageMeta:{source:"ai" as const,scene,model,createdAt:new Date().toISOString(),originalImage:section.imageMeta?.originalImage ?? section.image}};
}
