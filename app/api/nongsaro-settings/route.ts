import { NextResponse } from "next/server";
import { publicNongsaroSettings, saveNongsaroSettings } from "@/lib/nongsaro-settings";
import { currentMember } from "@/lib/commerce-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {try{return NextResponse.json(await publicNongsaroSettings());}catch{return NextResponse.json({error:"농사로 설정을 읽지 못했어요."},{status:500});}}
export async function POST(request:Request) {
  const member=await currentMember();if(member&&member.role!=="admin")return NextResponse.json({error:"연결 설정은 운영자가 관리합니다."},{status:403});
  try {
    const origin=request.headers.get("origin");if(origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({error:"설정 화면에서 요청해주세요."},{status:403});
    return NextResponse.json(await saveNongsaroSettings(await request.json()));
  }catch(e){return NextResponse.json({error:e instanceof Error ? e.message : "농사로 설정을 저장하지 못했어요."},{status:400});}
}
