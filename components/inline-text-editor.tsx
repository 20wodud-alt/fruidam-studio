"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
export type InlineTextState={sectionId:string;target:string;text:string;left:number;top:number;width:number;height:number;style:CSSProperties};
export function InlineTextEditor({editing,onCommit,onCancel}:{editing:InlineTextState;onCommit:(text:string)=>void;onCancel:()=>void}){
  const [value,setValue]=useState(editing.text);const ref=useRef<HTMLTextAreaElement>(null),done=useRef(false);
  useEffect(()=>{ref.current?.focus({preventScroll:true});},[]);
  function finish(){if(done.current)return;done.current=true;onCommit(value);}
  return <div className="canvas-inline-editor" style={{left:editing.left,top:editing.top,width:Math.max(160,editing.width)}} onPointerDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}><textarea ref={ref} aria-label="캔버스 텍스트 수정" value={value} maxLength={editing.target==="title"?150:editing.target==="kicker"?200:editing.target.startsWith("extra:")?3000:5000} style={{...editing.style,minHeight:Math.max(65,editing.height+12)}} onChange={e=>setValue(e.target.value)} onBlur={finish} onKeyDown={e=>{if(e.nativeEvent.isComposing)return;if(e.key==="Escape"){e.preventDefault();done.current=true;onCancel();}else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();finish();}}}/><div><small>Ctrl+Enter 완료 · Esc 취소</small><button onMouseDown={e=>e.preventDefault()} onClick={finish}>수정 완료</button></div></div>;
}
