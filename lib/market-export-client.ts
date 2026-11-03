"use client";
import { marketProfiles, type MarketImageFormat, type MarketPlatform } from "./market-export";

export async function exportMarketImage(element:HTMLElement,platform:MarketPlatform,format:MarketImageFormat,fontCSS:string,progress:(message:string)=>void){
  const profile=marketProfiles[platform],scale=profile.width/860,total=Math.ceil(element.scrollHeight*scale);
  if(!total)throw new Error("내보낼 상세페이지가 없어요.");
  // Render in small surfaces, then join into exactly one downloaded image.
  // Never silently split the user's download if a browser cannot encode it.
  if(total>32760)throw new Error("전체 이미지가 브라우저에서 저장할 수 있는 높이를 넘었어요. 페이지 길이를 줄이거나 보관용 HTML로 저장해주세요.");
  const output=document.createElement("canvas");output.width=profile.width;output.height=total;
  const context=output.getContext("2d");if(!context)throw new Error("긴 이미지를 준비하지 못했어요. 다른 브라우저에서 다시 다운로드해주세요.");
  context.fillStyle="#fff";context.fillRect(0,0,profile.width,total);
  progress("사진과 글꼴을 준비하고 있어요.");
  const clone=element.cloneNode(true) as HTMLElement,embedded=new Map<string,string>();
  for(const img of Array.from(clone.querySelectorAll("img"))){
    const source=img.src;
    if(!embedded.has(source)){
      const response=await fetch(source);if(!response.ok)throw new Error("사진을 내보내지 못했어요.");
      const blob=await response.blob();
      embedded.set(source,await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("사진을 읽지 못했어요."));reader.readAsDataURL(blob);}));
    }
    img.src=embedded.get(source)!;img.removeAttribute("loading");
  }
  const {toCanvas}=await import("html-to-image"),viewport=document.createElement("div");
  Object.assign(viewport.style,{position:"fixed",left:"-10000px",top:"0",width:`${profile.width}px`,overflow:"hidden",background:"#fff",pointerEvents:"none"});
  viewport.setAttribute("aria-hidden","true");
  Object.assign(clone.style,{position:"absolute",left:"0",top:"0",margin:"0",width:"860px",transformOrigin:"top left"});
  viewport.append(clone);document.body.append(viewport);
  try{
    await Promise.all(Array.from(clone.querySelectorAll("img")).map(img=>img.decode()));
    for(let start=0;start<total;start+=2048){
      const height=Math.min(2048,total-start);
      progress(`상세페이지를 한 장으로 연결하고 있어요 · ${Math.floor(start/total*100)}%`);
      viewport.style.height=`${height}px`;clone.style.transform=`translateY(-${start}px) scale(${scale})`;
      const canvas=await toCanvas(viewport,{pixelRatio:1,width:profile.width,height,canvasWidth:profile.width,canvasHeight:height,backgroundColor:"#fff",fontEmbedCSS:fontCSS,skipAutoScale:true,style:{position:"relative",inset:"auto",insetInline:"auto",insetBlock:"auto",left:"0",top:"0",right:"auto",bottom:"auto",margin:"0"}});
      context.drawImage(canvas,0,start);canvas.width=canvas.height=1;
      await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    }
    progress("긴 이미지 파일 1개를 저장하고 있어요.");
    const blob=await new Promise<Blob|null>(resolve=>output.toBlob(resolve,format==="jpg"?"image/jpeg":"image/png",.94));
    if(!blob)throw new Error("긴 이미지 파일을 만들지 못했어요. 페이지 길이를 줄여 다시 다운로드해주세요.");
    return {blob,width:profile.width,height:total};
  }finally{viewport.remove();output.width=output.height=1;}
}
