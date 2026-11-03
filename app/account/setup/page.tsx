import type { Metadata } from "next";
import { CommerceApp } from "@/components/commerce-app";

export const metadata:Metadata={title:"입점 계정 비밀번호 설정 — 열매담",robots:{index:false,follow:false}};

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const query=await searchParams;
  const email=typeof query.email==="string"?query.email.trim().slice(0,254):"";
  const name=typeof query.name==="string"?query.name.trim().slice(0,60):"";
  return <CommerceApp view="account-setup" accountSetup={{email,name}}/>;
}
