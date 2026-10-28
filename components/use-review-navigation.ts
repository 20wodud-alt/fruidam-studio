"use client";
import { useEffect, useRef, useState } from "react";

export function useReviewNavigation(firstId:string,visibilityKey:string) {
  const root=useRef<HTMLElement|null>(null),lockUntil=useRef(0),readingIntent=useRef(true);
  const [selection,setSelection]=useState({id:firstId,target:"section",revision:0});
  function select(id:string,target="section",lock=400){
    lockUntil.current=Date.now()+lock;
    readingIntent.current=false;
    setSelection(previous=>({id,target,revision:previous.revision+1}));
  }
  useEffect(()=>{
    let frame=0,timer:ReturnType<typeof setTimeout>|undefined;
    const followReading=()=>{
      frame=0;if(document.querySelector('.rc-dialog[open]'))return;
      if(Date.now()<lockUntil.current){clearTimeout(timer);timer=setTimeout(schedule,lockUntil.current-Date.now()+16);return;}
      const focused=document.activeElement?.closest<HTMLElement>('.copy-review-card');
      if(focused&&!readingIntent.current){const rect=focused.getBoundingClientRect();if(rect.bottom>0&&rect.top<window.innerHeight)return;}
      const cards=Array.from(root.current?.querySelectorAll<HTMLElement>('.copy-review-card') || []);
      const line=Math.min(220,window.innerHeight*.3);
      const visible=cards.map(card=>({card,rect:card.getBoundingClientRect()})).filter(item=>item.rect.bottom>80&&item.rect.top<window.innerHeight-100);
      const atEnd=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-32;
      const chosen=atEnd?visible.at(-1):visible.find(item=>item.rect.top<=line&&item.rect.bottom>line) || visible.find(item=>item.rect.top>line) || visible.at(-1);
      const id=chosen?.card.dataset.auditSection;
      if(id)setSelection(previous=>previous.id===id?previous:{id,target:"section",revision:previous.revision+1});
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(followReading);};
    const startReading=(event:Event)=>{const target=event.target instanceof Element?event.target:null;if(target?.closest('.rc-viewport,.rc-dialog'))return;readingIntent.current=true;lockUntil.current=0;schedule();};
    const keyboardReading=(event:KeyboardEvent)=>{if(['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(event.key)&&!(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable=true]')))startReading(event);};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);schedule();
    window.addEventListener('wheel',startReading,{passive:true});window.addEventListener('touchmove',startReading,{passive:true});window.addEventListener('keydown',keyboardReading);
    return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('wheel',startReading);window.removeEventListener('touchmove',startReading);window.removeEventListener('keydown',keyboardReading);if(frame)cancelAnimationFrame(frame);clearTimeout(timer);};
  },[visibilityKey]);
  const rootRef=(node:HTMLElement|null)=>{root.current=node;};
  return {rootRef,selection,select};
}
