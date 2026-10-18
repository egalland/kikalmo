'use client';
import {useEffect} from 'react';
import {mobileViewport} from '../../lib/mobile-viewport.mjs';

export default function useGameViewport(room:string){
 useEffect(()=>{
  const root=document.documentElement,body=document.body,vv=window.visualViewport;
  let baseline=window.innerHeight,lastWidth=window.innerWidth,frame=0;
  const classes=['game-session','keyboard-open','daily-typing','viewport-tight','viewport-short'];
  body.classList.toggle('game-session',!!room);
  const update=()=>{
   frame=0;const width=window.innerWidth,height=vv?.height??window.innerHeight;
   if(Math.abs(width-lastWidth)>80){baseline=window.innerHeight;lastWidth=width;}
   baseline=Math.max(baseline,window.innerHeight,height);
   const element=document.activeElement;
   const focused=element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement;
   const metrics=mobileViewport({width,height,offsetTop:vv?.offsetTop??0,baselineHeight:baseline,focused,daily:!!element?.closest('.daily-form'),scale:vv?.scale??1});
   root.style.setProperty('--play-height',metrics.height+'px');root.style.setProperty('--play-top',metrics.top+'px');
   body.classList.toggle('keyboard-open',metrics.keyboard);
   body.classList.toggle('daily-typing',metrics.dailyTyping);
   body.classList.toggle('viewport-tight',metrics.tight);body.classList.toggle('viewport-short',metrics.short);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  update();
  window.addEventListener('resize',schedule);vv?.addEventListener('resize',schedule);vv?.addEventListener('scroll',schedule);
  document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
  // A disabled or removed input can lose focus without a focusout event.
  const focusObserver=new MutationObserver(schedule);focusObserver.observe(body,{subtree:true,childList:true});
  return()=>{
   cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);vv?.removeEventListener('resize',schedule);vv?.removeEventListener('scroll',schedule);
   document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);focusObserver.disconnect();
   classes.forEach(c=>body.classList.remove(c));root.style.removeProperty('--play-height');root.style.removeProperty('--play-top');
  };
 },[room]);
}
