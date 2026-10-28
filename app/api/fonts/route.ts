import { promises as fs } from "node:fs";
import path from "node:path";
import { fontCatalog } from "@/lib/fonts";
export const runtime="nodejs";
const cache=new Map<string,string>();
export async function GET(request:Request){
  const ids=(new URL(request.url).searchParams.get("ids") || "sans").split(",");
  const fonts=fontCatalog.filter(font=>ids.includes(font.id));if(!fonts.length)return new Response("Unknown fonts",{status:400});
  const key=fonts.map(f=>f.id).join(",");if(cache.has(key))return new Response(cache.get(key),{headers:{"Content-Type":"text/css; charset=utf-8"}});
  try{
    const result=(await Promise.all(fonts.map(font=>fs.readFile(path.join(process.cwd(),"public","font-exports",`${font.package}.css`),"utf8")))).join("\n");
    cache.set(key,result);return new Response(result,{headers:{"Content-Type":"text/css; charset=utf-8"}});
  }catch{return new Response("Font embedding failed",{status:500});}
}
