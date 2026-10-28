export type GenerationStage={id:string;label:string;detail:string;state:"running"|"complete"};
export type GenerationEvent={type:"stage";stage:GenerationStage}|{type:"complete";project:import("./studio").StudioProject}|{type:"error";error:string};
