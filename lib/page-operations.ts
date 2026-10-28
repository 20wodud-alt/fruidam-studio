import type {Section,StudioProject} from "./studio";
export type InsertPageKind="blank"|"photo"|"text";
export function insertPageAfter(project:StudioProject,afterId:string,kind:InsertPageKind){
  if(project.sections.length>=30)throw new Error("페이지는 최대 30개까지 추가할 수 있어요.");
  const index=afterId?project.sections.findIndex(s=>s.id===afterId):-1;
  if(afterId&&index<0)throw new Error("삽입할 위치를 확인해주세요.");
  const section:Section={id:crypto.randomUUID(),kind:kind==="text"?"story":"detail",canvasMode:kind==="text"?undefined:kind,title:kind==="text"?"제목을 입력해주세요":"",body:kind==="text"?"내용을 입력해주세요":"",kicker:"",image:"",visible:true,reviewed:false,format:{background:"#ffffff",minHeight:kind==="photo"?600:360,padding:kind==="text"?60:0}};
  const sections=[...project.sections];sections.splice(index+1,0,section);
  return {project:{...project,sections},section};
}
export function resizePage(project:StudioProject,id:string,height:number){
  if(!Number.isFinite(height))throw new Error("페이지 길이를 확인해주세요.");
  return {...project,sections:project.sections.map(s=>s.id===id?{...s,format:{...s.format,minHeight:Math.max(100,Math.min(8000,Math.round(height)))}}:s)};
}
