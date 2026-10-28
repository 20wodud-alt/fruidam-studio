"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
type Row={id:string;text:string;selected:boolean};
export function ProductOptionsInput({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  const makeRows=(text:string):Row[]=>text.split("\n").filter(Boolean).map((text,index)=>({id:`initial-${index}`,text,selected:true}));
  const [rows,setRows]=useState<Row[]>(()=>value ? makeRows(value) : [{id:"initial-empty",text:"",selected:true}]);
  const tracked=useRef(value);const inputs=useRef(new Map<string,HTMLInputElement>());
  useEffect(()=>{if(value===tracked.current)return;tracked.current=value;const next=makeRows(value);queueMicrotask(()=>setRows(next.length ? next : [{id:crypto.randomUUID(),text:"",selected:true}]));},[value]);
  function commit(next:Row[]){setRows(next);const text=next.filter(row=>row.selected).map(row=>row.text.trim()).filter(Boolean).join("\n");tracked.current=text;onChange(text);}
  function add(){if(rows.length>=20)return;const id=crypto.randomUUID();commit([...rows,{id,text:"",selected:true}]);requestAnimationFrame(()=>inputs.current.get(id)?.focus());}
  return <div className="field option-rows" role="group" aria-label="상품 옵션"><span className="field-label">상품 옵션<small>한 줄에 하나씩 · 체크한 옵션만 사용해요</small></span>{rows.map((row,index)=><div className={`option-row ${row.selected ? "" : "not-selected"}`} key={row.id}><input type="checkbox" aria-label={`옵션 ${index+1} 포함`} checked={row.selected} onChange={e=>commit(rows.map(r=>r.id===row.id ? {...r,selected:e.target.checked} : r))}/><span>{String(index+1).padStart(2,"0")}</span><input ref={node=>{if(node)inputs.current.set(row.id,node);else inputs.current.delete(row.id);}} aria-label={`상품 옵션 ${index+1}`} value={row.text} maxLength={80} placeholder={index ? "예) 선물용 5kg" : "예) 가정용 3kg"} onChange={e=>commit(rows.map(r=>r.id===row.id ? {...r,text:e.target.value} : r))} onKeyDown={e=>{if(e.key==="Enter" && !e.nativeEvent.isComposing){e.preventDefault();add();}}}/><button type="button" aria-label={`옵션 ${index+1} 삭제`} disabled={rows.length===1} onClick={()=>commit(rows.filter(r=>r.id!==row.id))}><X size={14}/></button></div>)}<button type="button" className="option-add" disabled={rows.length>=20} onClick={add}><Plus size={13}/>옵션 추가<span>{rows.length}/20</span></button></div>;
}
