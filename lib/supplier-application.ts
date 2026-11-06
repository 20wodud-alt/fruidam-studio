import { supplierBusinessTypes, type SupplierApplication } from "./commerce";
import { CommerceError } from "./commerce-store";

export function validateSupplierApplication(value:unknown):SupplierApplication{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new CommerceError("입점 신청 내용을 확인해주세요.");
  const input=value as Record<string,unknown>;
  const field=(key:string,label:string,max:number)=>{
    const value=input[key]??"";
    if(typeof value!=="string"||value.trim().length>max)throw new CommerceError(`${label} 입력 내용을 확인해주세요. (최대 ${max}자)`);
    return value.trim();
  };
  const businessType=field("businessType","업체 유형",30);
  if(businessType&&!Object.hasOwn(supplierBusinessTypes,businessType))throw new CommerceError("업체 유형을 선택해주세요.");
  const phone=field("phone","연락처",30),businessNumber=field("businessNumber","사업자등록번호",12);
  if(phone&&(!/^[\d+() -]+$/.test(phone)||phone.replace(/\D/g,"").length<7))throw new CommerceError("연락처는 숫자와 하이픈으로 입력해주세요.");
  if(businessNumber&&!/^\d{3}-?\d{2}-?\d{5}$/.test(businessNumber))throw new CommerceError("사업자등록번호는 숫자 10자리로 입력해주세요.");
  return {businessType:businessType as SupplierApplication["businessType"],representative:field("representative","대표자명",60),phone,address:field("address","주소",300),businessNumber,mainProducts:field("mainProducts","주요 취급 과일",300),introduction:field("introduction","농가·업체 소개",2000)};
}
