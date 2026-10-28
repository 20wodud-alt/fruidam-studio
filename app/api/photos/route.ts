import {readPhotoLibrary} from "@/lib/photo-library";
import {studioAccess} from "@/lib/studio-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  const projectId=new URL(request.url).searchParams.get("projectId");
  if(!projectId)return Response.json({error:"편집 중인 상세페이지를 지정해주세요."},{status:400});
  try{
    const project=(await studioAccess()).find(p=>p.id===projectId);
    if(!project)return Response.json({error:"상세페이지를 찾을 수 없어요."},{status:404});
    return Response.json(await readPhotoLibrary(project),{headers:{"Cache-Control":"no-store"}});
  }
  catch{return Response.json({error:"보관한 사진을 불러오지 못했어요."},{status:500});}
}
