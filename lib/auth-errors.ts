export function authFailureDetails(endpoint:string,status:number,code:unknown){
  if(status===429)return {status:429,code:"rate_limited",message:"인증 요청이 많습니다. 잠시 후 다시 시도해주세요."};
  if(code==="email_not_confirmed")return {status:401,code,message:"이메일 인증이 아직 완료되지 않았습니다. 가입한 이메일의 인증 링크를 누른 뒤 다시 로그인해주세요."};
  if(code==="invalid_credentials")return {status:401,code,message:"이메일 또는 비밀번호가 일치하지 않습니다. 가입한 계정 정보를 다시 확인해주세요."};
  if(code==="email_address_not_authorized"||code==="email_provider_disabled")return {status:503,code,message:"인증메일 발송 설정을 확인해야 합니다. 운영자에게 문의해주세요."};
  return {status:401,code:"auth_request_failed",message:endpoint.startsWith("token")?"로그인 정보를 확인해주세요. 계속 실패하면 운영자에게 문의해주세요.":"회원 인증 요청을 처리하지 못했습니다. 입력 정보와 이메일을 확인해주세요."};
}
