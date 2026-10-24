'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {HALLOWEEN} from '../../lib/cosmetics';

// Keep the approved lettering intact at rest; each region moves independently.
const edges=[0,258,339,518,679,777,1003,1200];
const vowels=new Set([1,3,6]);
export default function AnimatedLogo(){
 const id=useId().replace(/:/g,'');
 const [halloween,setHalloween]=useState(false);
 useEffect(()=>{const update=()=>setHalloween(Date.now()>=Date.parse('2026-10-23T00:00:00+02:00')&&Date.now()<HALLOWEEN.endsAt);update();const timer=setInterval(update,60000);return()=>clearInterval(timer);},[]);
 const letters=useRef<(SVGGElement|null)[]>([]);
 useEffect(()=>{
  if(halloween)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let timer:ReturnType<typeof setTimeout>|undefined;
  let animation:Animation|null=null;
  let disposed=false,last=-1;
  const pause=()=>{clearTimeout(timer);animation?.cancel();animation=null;};
  const schedule=()=>{
   if(disposed||document.hidden||reduced.matches)return;
   timer=setTimeout(play,1000+Math.random()*2500);
  };
  const play=()=>{
   if(disposed||document.hidden||reduced.matches)return;
   const pool=[0,1,1,2,3,3,4,5,6,6].filter(index=>index!==last);
   const index=pool[Math.floor(Math.random()*pool.length)];last=index;
   const letter=letters.current[index];
   if(!letter?.animate){schedule();return;}
   const tilt=(Math.random()<.5?-1:1)*(2+Math.random()*2);
   const lift=(vowels.has(index)?15:9)+Math.random()*5;
   const hop=Math.random()<.6;
   animation=letter.animate([
    {transform:'translateY(0px) rotate(0deg)'},
    {transform:`translateY(${hop?-lift:-3}px) rotate(${tilt}deg)`,offset:.34},
    {transform:`translateY(${hop?2:0}px) rotate(${-tilt*.45}deg)`,offset:.68},
    {transform:'translateY(0px) rotate(0deg)'}
   ],{duration:650+Math.random()*350,easing:'ease-in-out',iterations:1});
   animation.onfinish=()=>{animation=null;schedule();};
  };
  const resume=()=>{pause();schedule();};
  document.addEventListener('visibilitychange',resume);
  reduced.addEventListener('change',resume);
  schedule();
  return()=>{disposed=true;pause();document.removeEventListener('visibilitychange',resume);reduced.removeEventListener('change',resume);};
 },[halloween]);
 if(halloween)return <img className="brand-logo brand-logo-halloween" src="/branding/kikalmo-halloween.webp" width="1200" height="345" alt="Kikalmo · Halloween"/>;
 return <svg className="brand-logo" viewBox="0 0 1200 307" width="1200" height="307" role="img" aria-label="Kikalmo" style={{overflow:'visible'}}>
  <defs>{edges.slice(0,-1).map((left,index)=><clipPath key={index} id={`${id}-letter-${index}`}><rect x={left} y="0" width={edges[index+1]-left} height="307"/></clipPath>)}</defs>
  {edges.slice(0,-1).map((left,index)=><g key={index} ref={element=>{letters.current[index]=element;}} style={{transformOrigin:`${(left+edges[index+1])/2}px 285px`}} aria-hidden="true"><image href="/branding/kikalmo-stitched.webp" width="1200" height="307" clipPath={`url(#${id}-letter-${index})`}/></g>)}
 </svg>;
}
