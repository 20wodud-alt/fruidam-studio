import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseStorageConfig } from "./supabase-storage";
import { CommerceError, commerceAccess } from "./commerce-store";
import type { Member } from "./commerce";
import { registerCommerceMember } from "./commerce-members";

export async function authRequest(endpoint: string, body?: unknown, token?: string) {
  const {url,key} = supabaseStorageConfig();
  const response = await fetch(`${url}/auth/v1/${endpoint}`, {method: body === undefined ? "GET" : "POST", headers: {apikey:key, "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {})}, ...(body === undefined ? {} : {body:JSON.stringify(body)}), cache:"no-store", signal:AbortSignal.timeout(15000)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new CommerceError(response.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해주세요." : endpoint.startsWith("token") ? "이메일·비밀번호 또는 이메일 인증 여부를 확인해주세요." : "회원 인증 요청을 처리하지 못했습니다. 입력 정보와 이메일을 확인해주세요.", response.status === 429 ? 429 : 401);
  return data;
}
export async function authUser() {
  const jar = await cookies();
  const token = jar.get("fruidam-access")?.value;
  type User={id:string; email:string; email_confirmed_at?:string; created_at:string; user_metadata?:Record<string,string>};
  if (token) try { return await authRequest("user", undefined, token) as User; } catch(error) { if(!(error instanceof CommerceError&&error.status===401))throw error; }
  const refresh=jar.get("fruidam-refresh")?.value;if(!refresh)return null;
  try{const data=await authRequest("token?grant_type=refresh_token",{refresh_token:refresh});const opts={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax" as const,path:"/"};jar.set("fruidam-access",data.access_token,{...opts,maxAge:data.expires_in||3600});jar.set("fruidam-refresh",data.refresh_token,{...opts,maxAge:30*86400});return data.user as User;}catch(error){if(error instanceof CommerceError&&error.status===401)return null;throw error;}
}
export async function currentMember(): Promise<Member | null> {
  const user = await authUser(); if (!user) return null;
  let state = await commerceAccess(); let member = state.members.find(m=>m.id===user.id);
  if (!member) {
    state = await commerceAccess(s=>{registerCommerceMember(s,user);});
    member = state.members.find(m=>m.id===user.id);
  }
  const ownerEmail=process.env.FRUIDAM_OWNER_EMAIL?.trim().toLowerCase();
  if(member&&member.role!=="admin"&&ownerEmail&&user.email_confirmed_at&&user.email.toLowerCase()===ownerEmail){state=await commerceAccess(s=>{const owner=s.members.find(m=>m.id===user.id);if(owner)owner.role="admin";});member=state.members.find(m=>m.id===user.id);}
  return member || null;
}
export async function requireMember() { const member = await currentMember(); if(!member)throw new CommerceError("로그인 후 이용해주세요.",401); return member; }
export function sessionResponse(data: {access_token?:string;refresh_token?:string;expires_in?:number}, body: unknown) {
  const response = NextResponse.json(body, {headers:{"Cache-Control":"no-store"}});
  if(data.access_token)response.cookies.set("fruidam-access",data.access_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:data.expires_in || 3600});
  if(data.refresh_token)response.cookies.set("fruidam-refresh",data.refresh_token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
  return response;
}
export function sameOrigin(request:Request) { const origin=request.headers.get("origin"); if(!origin || new URL(origin).host!==request.headers.get("host"))throw new CommerceError("사이트에서 다시 요청해주세요.",403); }
