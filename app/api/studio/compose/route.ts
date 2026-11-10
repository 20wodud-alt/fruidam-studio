import { withApiAccess } from "@/lib/api-access";
import { composeCopy } from "@/lib/ai-copywriter";
import { sameOrigin } from "@/lib/commerce-auth";
import { fruitCompositionRequest } from "@/lib/fruit-composition";
import { emptyDesignBrief } from "@/lib/studio";
import { studioAccess } from "@/lib/studio-store";
import { backupStudioProject } from "@/lib/asset-store";
export const runtime="nodejs";
export const maxDuration=120;
async function handlePOST(request:Request){
  try{
    sameOrigin(request);
    const input=await request.json();
    const project=(await studioAccess()).find(p=>p.id===input.projectId);
    if(!project)return Response.json({error:"작업을 찾을 수 없습니다."},{status:404});
    await backupStudioProject(project);
    const product={...project.product,design:{...emptyDesignBrief,...project.product.design,photoDirection:{mode:"mixed" as const,people:project.product.design?.photoDirection?.people??false,instructions:"실제 대표·옵션 사진 유지. 과육 접사와 탑뷰 식탁, 사선 원물 정물을 섞어 상품에 맞게 연출합니다."}}};
    const generated=await composeCopy(product,project.sections,fruitCompositionRequest,false);
    return Response.json({project:{...project,product,sections:generated.sections,copyReport:generated.report}},{headers:{"Cache-Control":"no-store"}});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"구성안을 다듬지 못했어요. 기존 작업은 유지됩니다."},{status:400});}
}

export const POST=withApiAccess(handlePOST);
