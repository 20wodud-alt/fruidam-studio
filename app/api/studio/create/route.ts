import { randomUUID } from "node:crypto";
import { product } from "@/lib/validate-product";
import { generateSections } from "@/lib/studio";
import { composeCopy } from "@/lib/ai-copywriter";
import { readAISettings } from "@/lib/ai-settings";
import { storageProvider } from "@/lib/supabase-storage";
import { studioAccess } from "@/lib/studio-store";
import type { GenerationEvent } from "@/lib/generation-progress";
export const runtime="nodejs";
export const maxDuration=120;
export async function POST(request:Request){
  const origin=request.headers.get("origin");if(origin && new URL(origin).host!==request.headers.get("host"))return Response.json({error:"앱에서 요청해주세요."},{status:403});
  let input;try{input=await request.json();}catch{return Response.json({error:"상품 요청 형식을 확인해주세요."},{status:400});}
  let info:ReturnType<typeof product>;
  try{info=product(input.product);}catch(e){return Response.json({error:e instanceof Error?e.message:"상품 정보를 확인해주세요."},{status:400});}
  const id=typeof input.requestId==="string" && /^[a-f0-9-]{36}$/i.test(input.requestId) ? input.requestId : randomUUID();
  const encoder=new TextEncoder();let closed=false;
  const stream=new ReadableStream({
    async start(controller){
      const emit=(event:GenerationEvent)=>{if(!closed)controller.enqueue(encoder.encode(JSON.stringify(event)+"\n"));};
      const stage=(id:string,label:string,detail:string,state:"running"|"complete"="running")=>emit({type:"stage",stage:{id,label,detail,state}});
      try{
        const existing=(await studioAccess()).find(p=>p.id===id);if(existing){emit({type:"complete",project:existing});return;}
        stage("product","상품 정보 확인","상품명·특징·선택 옵션과 참고 자료를 정리하고 있어요.");
        const sections=generateSections(info);stage("product","상품 정보 확인","입력한 상품 자료를 확인했어요.","complete");
        stage("structure","페이지 흐름 구성",`${sections.length}개 섹션의 순서와 역할을 구성하고 있어요.`);
        stage("structure","페이지 흐름 구성",`${sections.length}개 섹션의 기본 흐름을 준비했어요.`,"complete");
        const settings=await readAISettings();
        stage("copy","상품 카피 작성",settings.apiKey && settings.enabled ? `AI가 제목과 설명을 작성하고 있어요.${settings.research?" 공개 상품 정보 검색을 함께 요청합니다.":""} 응답을 기다리는 중이에요.` : "입력한 특징과 옵션으로 기본 제목·설명을 작성하고 있어요.");
        const generated=await composeCopy(info,sections);
        stage("copy","상품 카피 작성","섹션별 제목·설명을 작성하고 문구 형식을 확인했어요.","complete");
        stage("save","작업 저장",storageProvider() === "supabase" ? "\uAD6C\uC131\uC548\uC744 Supabase\uC5D0 \uC800\uC7A5\uD558\uACE0 \uC788\uC5B4\uC694." : "\uAD6C\uC131\uC548\uC744 \uB0B4 \uCEF4\uD4E8\uD130\uC5D0 \uC800\uC7A5\uD558\uACE0 \uC788\uC5B4\uC694.");
        if(request.signal.aborted || closed)return;
        const project={id,product:info,sections:generated.sections,copyReport:generated.report,starred:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
        await studioAccess(projects=>{if(!projects.some(p=>p.id===id))projects.unshift(project);});
        stage("save","작업 저장","구성안을 안전하게 저장했어요.","complete");emit({type:"complete",project});
      }catch(e){emit({type:"error",error:e instanceof Error?e.message:"구성안을 만들지 못했어요."});}finally{if(!closed){closed=true;controller.close();}}
    },cancel(){closed=true;},
  });
  return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Cache-Control":"no-store","X-Accel-Buffering":"no"}});
}
