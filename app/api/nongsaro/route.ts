import { NextResponse } from "next/server";
import { getNongsaroReferences } from "@/lib/nongsaro";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){try{return NextResponse.json(await getNongsaroReferences());}catch{return NextResponse.json({error:"농사로 연결 준비 정보를 읽지 못했어요."},{status:500});}}
