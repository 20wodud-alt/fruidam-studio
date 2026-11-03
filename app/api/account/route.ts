import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authRequest, currentMember, sameOrigin, sessionResponse } from "@/lib/commerce-auth";
import { CommerceError } from "@/lib/commerce-store";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){try{return NextResponse.json({member:await currentMember()},{headers:{"Cache-Control":"no-store"}});}catch{return NextResponse.json({member:null,error:"회원 서비스를 연결하지 못했습니다."},{status:503});}}
export async function POST(request:Request){
  try {
    sameOrigin(request);const input=await request.json();
    if(input.action==="logout"){const response=NextResponse.json({ok:true});response.cookies.delete("fruidam-access");response.cookies.delete("fruidam-refresh");return response;}
    if(input.action==="refresh"){const token=(await cookies()).get("fruidam-refresh")?.value;if(!token)throw new CommerceError("다시 로그인해주세요.",401);const data=await authRequest("token?grant_type=refresh_token",{refresh_token:token});return sessionResponse(data,{ok:true});}
    const email=typeof input.email==="string" ? input.email.trim().toLowerCase():"";const password=typeof input.password==="string"?input.password:"";
    if(input.action==="resendConfirmation"){
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new CommerceError("인증메일을 받을 이메일을 입력해주세요.");
      await authRequest("resend",{type:"signup",email});
      return NextResponse.json({ok:true,message:"인증메일 재발송 요청을 접수했습니다. 인증이 필요한 계정이라면 받은편지함과 스팸함에서 가장 최근 메일을 확인해주세요."},{headers:{"Cache-Control":"no-store"}});
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<10||password.length>128)throw new CommerceError("올바른 이메일과 10자 이상의 비밀번호를 입력해주세요.");
    if(input.action==="signup"){
      const name=typeof input.name==="string"?input.name.trim().slice(0,60):"";if(!name)throw new CommerceError("이름 또는 업체명을 입력해주세요.");
      const data=await authRequest("signup",{email,password,data:{name,role:input.role==="supplier"?"supplier":"seller"}});
      return sessionResponse(data,{ok:true,confirmationRequired:!data.access_token,message:data.access_token?"가입이 완료됐습니다.":"이메일로 받은 인증 링크를 확인한 후 로그인해주세요."});
    }
    if(input.action!=="login")throw new CommerceError("지원하지 않는 요청입니다.");
    const data=await authRequest("token?grant_type=password",{email,password});return sessionResponse(data,{ok:true});
  }catch(error){return NextResponse.json({error:error instanceof CommerceError?error.message:"회원 요청을 처리하지 못했습니다.",code:error instanceof CommerceError?error.code:undefined},{status:error instanceof CommerceError?error.status:503});}
}
