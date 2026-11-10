import { currentMember } from "@/lib/commerce-auth";
import { approvedAccess } from "@/lib/member-access";
import { MemberAccessGate } from "@/components/member-access-gate";
export const dynamic="force-dynamic";
export default async function StudioLayout({children}:{children:React.ReactNode}){
  let member;
  try{member=await currentMember();}catch{return <MemberAccessGate member={null} unavailable/>;}
  if(!approvedAccess(member))return <MemberAccessGate member={member}/>;
  return children;
}
