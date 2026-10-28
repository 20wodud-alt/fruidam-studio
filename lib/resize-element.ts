import {setTargetFormat,targetFormat} from "./canvas-operations";
import type {ElementSize} from "./editor-metrics";
import type {ResizeInstruction} from "./resize-instruction";
import type {Section} from "./studio";
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Math.round(n*100)/100));
export function resizeElement(section:Section,target:string,command:ResizeInstruction,metric?:ElementSize):Section{
  const extra=section.elements?.find(e=>`extra:${e.id}`===target),photo=target==="image"||extra?.type==="image",format=targetFormat(section,target);
  if(photo){
    if(!(extra?.image || (target==="image"&&section.image)))return section;
    const container=metric?.containerWidth || (section.kind==="story"?732:860);
    const w=metric?.width || (extra?.absolute?extra.widthPx:undefined) || format.widthPx || container*(format.width??100)/100;
    const h=metric?.height || format.height || (extra?400:section.kind==="hero"?740:section.kind==="story"?410:600);
    let width=command.axis==="height"?w:w*(command.factor??1)+(command.deltaPx??0),height=command.axis==="width"?h:h*(command.factor??1)+(command.deltaPx??0);
    if(command.widthPx!==undefined)width=command.widthPx;
    if(command.heightPx!==undefined)height=command.heightPx;
    if(command.widthPercent!==undefined)width=container*command.widthPercent/100;
    if(command.heightPercent!==undefined)height=h*command.heightPercent/100;
    if(command.axis==="both"&&command.widthPx!==undefined&&command.heightPx===undefined)height=h*width/w;
    width=clamp(width,20,860);height=clamp(height,100,8000);
    if(Math.abs(width-w)<.1&&Math.abs(height-h)<.1)return section;
    let next=setTargetFormat(section,target,{widthPx:width,height});
    if(extra?.absolute)next={...next,elements:next.elements?.map(e=>e.id===extra.id?{...e,widthPx:width}:e)};
    return next;
  }
  const current=metric?.fontSize || format.fontSize || (target==="title"?section.kind==="hero"?65:38:target==="kicker"?12:19);
  if(command.axis==="width"&&command.widthPx!==undefined)return setTargetFormat(section,target,{widthPx:clamp(command.widthPx,20,860)});
  return setTargetFormat(section,target,{fontSize:clamp(current*(command.factor??1)+(command.deltaPx??0),10,120)});
}
