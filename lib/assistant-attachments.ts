export type AssistantAttachment = {id:string;name:string;type:"text";text:string;truncated?:boolean} | {id:string;name:string;type:"image";url:string};
export function validateAssistantAttachments(value: unknown): AssistantAttachment[] {
  if (value===undefined) return [];
  if (!Array.isArray(value) || value.length>3) throw new Error("파일은 최대 3개까지 첨부해주세요.");
  let textLength=0,images=0;
  return value.map(item=>{
    if(!item || typeof item.id!=="string" || item.id.length>100 || typeof item.name!=="string" || item.name.length>200) throw new Error("첨부파일 정보를 확인해주세요.");
    if(item.type==="text" && typeof item.text==="string" && item.text.length<=2000){
      textLength+=item.text.length;
      if(textLength>6000)throw new Error("첨부 문서의 참고 분량을 줄여주세요.");
      return {id:item.id,name:item.name,type:"text",text:item.text,truncated:Boolean(item.truncated)};
    }
    if(item.type==="image" && typeof item.url==="string" && /^\/api\/uploads\/[a-f0-9-]+\.webp$/.test(item.url)){
      if(++images>2)throw new Error("참고 이미지는 최대 2장까지 첨부해주세요.");
      return {id:item.id,name:item.name,type:"image",url:item.url};
    }
    throw new Error("지원하지 않는 첨부파일이에요.");
  });
}
