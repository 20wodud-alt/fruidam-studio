import type {StudioProject} from "./studio";
export function hasEditorChanges(before:StudioProject,after:StudioProject){
  const content=(project:StudioProject)=>JSON.stringify({product:project.product,sections:project.sections.map(section=>({...section,reviewed:undefined,kicker:section.kicker||""}))});
  return content(before)!==content(after);
}
