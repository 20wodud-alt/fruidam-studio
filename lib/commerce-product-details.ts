import type { SupplyProduct } from "./commerce";
import { CommerceError } from "./commerce-store";
type Input=Record<string,unknown>;
export function supplyDetails(input:Input,existing?:SupplyProduct){
  const value=(key:keyof SupplyProduct)=>Object.hasOwn(input,key)?input[key]:existing?.[key];
  const text=(key:keyof SupplyProduct,max:number)=>{const raw=value(key);if(raw===undefined||raw===null)return "";if(typeof raw!=="string"||raw.length>max)throw new CommerceError(`${key} 입력 길이와 형식을 확인해주세요.`);return raw.trim();};
  const fee=(key:"jejuSurcharge"|"remoteSurcharge")=>{const raw=value(key);const n=raw===undefined||raw===""?0:Number(raw);if(!Number.isSafeInteger(n)||n<0||n>1000000)throw new CommerceError("지역별 추가 배송비는 0~1,000,000원의 정수로 입력해주세요.");return n;};
  const rawImages=value("images");
  if(rawImages!==undefined&&(!Array.isArray(rawImages)||rawImages.length>10))throw new CommerceError("상품 사진은 최대 10장까지 등록할 수 있습니다.");
  const images=(rawImages===undefined?[input.image??existing?.image]:rawImages as unknown[]).filter(image=>image!==undefined&&image!=="");
  if(images.some(image=>typeof image!=="string"||!/^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(image)))throw new CommerceError("직접 업로드한 실제 상품 사진을 선택해주세요.");
  const unique=[...new Set(images as string[])];
  const taxStatus=value("taxStatus")||"unspecified";
  if(!["unspecified","tax_free","taxable"].includes(String(taxStatus)))throw new CommerceError("과세 여부를 선택해주세요.");
  const shippingLabel=value("shippingLabel")||"included";if(!["included","free"].includes(String(shippingLabel)))throw new CommerceError("기본 배송비 표시를 확인해주세요.");
  const rawYear=value("productionYear");let productionYear:number|undefined;
  if(rawYear!==undefined&&rawYear!==null&&rawYear!==""){productionYear=Number(rawYear);const currentYear=Number(new Intl.DateTimeFormat("en",{year:"numeric",timeZone:"Asia/Seoul"}).format(new Date()));if(!Number.isInteger(productionYear)||productionYear<2000||productionYear>currentYear+1)throw new CommerceError("생산연도를 확인해주세요.");}
  return {images:unique,image:unique[0]||"",badge:text("badge",60),variety:text("variety",100),taxStatus:taxStatus as NonNullable<SupplyProduct["taxStatus"]>,shippingLabel:shippingLabel as "included"|"free",dispatchType:text("dispatchType",60),carrier:text("carrier",60),productionYear,storageType:text("storageType",60),storageInstructions:text("storageInstructions",1500),jejuSurcharge:fee("jejuSurcharge"),remoteSurcharge:fee("remoteSurcharge")};
}
