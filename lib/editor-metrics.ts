export type ElementSize={width:number;height:number;fontSize?:number;containerWidth?:number};
export type EditorMetrics=Record<string,Record<string,ElementSize>>;
export function validateEditorMetrics(value:unknown):EditorMetrics{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  const result:EditorMetrics={};
  for(const [id,items] of Object.entries(value).slice(0,30)){
    if(!items||typeof items!=="object"||Array.isArray(items)||id.length>100)continue;
    const sizes:Record<string,ElementSize>={};
    for(const [target,size] of Object.entries(items).slice(0,24)){
      const s=size as ElementSize;if(target.length>110||!s||![s.width,s.height].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>0&&n<=50000))continue;
      sizes[target]={width:s.width,height:s.height,...(typeof s.fontSize==="number"&&s.fontSize>0&&s.fontSize<=120?{fontSize:s.fontSize}:{}),...(typeof s.containerWidth==="number"&&s.containerWidth>0&&s.containerWidth<=860?{containerWidth:s.containerWidth}:{})};
    }
    result[id]=sizes;
  }
  return result;
}
