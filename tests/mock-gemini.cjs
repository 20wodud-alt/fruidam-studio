// Test server only: block real Gemini calls and return deterministic text fixtures.
if(process.env.FRUIDAM_AI_FIXTURE!=="1")throw Error("Set FRUIDAM_AI_FIXTURE=1 only on the local test server.");
const http=require("node:http");
const originalWriteHead=http.ServerResponse.prototype.writeHead;
http.ServerResponse.prototype.writeHead=function(...args){this.setHeader("X-Fruidam-Test-AI","fixture");return originalWriteHead.apply(this,args);};
const originalFetch=globalThis.fetch;
globalThis.fetch=async function(input,init){
  const url=typeof input==="string"?input:input instanceof URL?input.href:input.url;
  if(new URL(url).hostname!=="generativelanguage.googleapis.com")return originalFetch(input,init);
  const body=JSON.parse(init.body);
  if(body.generationConfig?.responseModalities?.includes("IMAGE"))throw Error("Image generation is blocked in integration tests.");
  const payload=JSON.parse(body.contents[0].parts[0].text);
  const output={summary:"MOCK: section-aware fruit composition",reviewInsights:[],sections:payload.sections.map((s,i)=>({...s,title:`과일을 만나는 순간 ${i+1}`,body:s.kind==="options"?payload.product.options:`상품 특징에 맞춰 다듬은 설명 ${i+1}`,kicker:`FRUIT ${i+1}`,imageDirection:`원본 과일을 유지한 ${i%2?"과육 매크로":"탑뷰 식탁"} 자연광 연출`}))};
  return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(output)}]}}]});
};
