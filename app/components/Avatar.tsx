'use client';
import {useId,useSyncExternalStore} from 'react';
import {cleanAvatar,type Avatar as AvatarData} from '../../lib/profile';
import {feltColor,puppetPose,EXPRESSION_LABELS} from '../../lib/puppet';
import {puppetPlacement,puppetCollarY} from '../../lib/puppet-registration';

const listeners=new Set<()=>void>();let timer:ReturnType<typeof setInterval>|undefined;let time=0;let motion:MediaQueryList|undefined;
const zero=()=>0;const read=()=>time;const noSubscribe=()=>()=>{};
function updateClock(){if(timer){clearInterval(timer);timer=undefined;}if(listeners.size&&!document.hidden&&!motion?.matches){time=performance.now();timer=setInterval(()=>{time=performance.now();listeners.forEach(f=>f());},100);}else if(motion?.matches){time=0;listeners.forEach(f=>f());}}
function subscribe(listener:()=>void){listeners.add(listener);if(listeners.size===1){motion=window.matchMedia('(prefers-reduced-motion: reduce)');document.addEventListener('visibilitychange',updateClock);motion.addEventListener('change',updateClock);updateClock();}return()=>{listeners.delete(listener);if(!listeners.size){if(timer)clearInterval(timer);timer=undefined;document.removeEventListener('visibilitychange',updateClock);motion?.removeEventListener('change',updateClock);}};}
export default function Avatar({value,className='',label,animated=true,emotion}:{value?:AvatarData;className?:string;label?:string;animated?:boolean;emotion?:string}){
 const a=cleanAvatar(value),id=useId();const tick=useSyncExternalStore(animated?subscribe:noSubscribe,animated?read:zero,zero);const seed=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),a.shape*11+a.hair*7);const expression=emotion||'idle';const frame=puppetPose(a.eyes,a.mouth,expression,tick,seed,animated&&tick>0);
 return <PuppetArt value={a} frame={frame} id={id} className={className} label={label} expression={expression}/>;
}
export function PuppetArt({value,frame,id,className='',label,expression='idle'}:{value:AvatarData;frame:ReturnType<typeof puppetPose>;id:string;className?:string;label?:string;expression?:string}){
 const a=cleanAvatar(value),noseId='nose-'+id.replace(/[^a-zA-Z0-9_-]/g,'');const color=feltColor(a.color);const neckId=noseId+'-neck';const collarY=puppetCollarY(a.shape,frame);
 // All layers use the SAME square viewBox, including narrow workshop thumbnails.
 // Cropping each cell before positioning avoids background sizing / span height drift.
 const layer=(name:string,col:number,row:number,columns:number,rows:number,tint=false)=>{
  const {x,y,scaleX,scaleY,crop}=puppetPlacement(name,col,row,a.shape,frame);
  return <svg key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" x={x+crop.x*scaleX} y={y+crop.y*scaleY} width={crop.width*scaleX} height={crop.height*scaleY} viewBox={`${col*256+crop.x} ${row*256+crop.y} ${crop.width} ${crop.height}`} overflow="hidden" preserveAspectRatio="none" style={tint?{filter:color}:undefined}><image href={`/puppets/${name==='hair'||name==='accessory'||name==='outfit'?'parts':name==='nose'?'body':name}.webp?v=5`} x="0" y="0" width={columns*256} height={rows*256}/></svg>;
 };
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -24 280 280" width="256" height="256" preserveAspectRatio="xMidYMid meet" className={'cartoon-avatar felt-avatar '+className} role={label?'img':undefined} aria-label={label?(label+(EXPRESSION_LABELS[expression]?' — '+EXPRESSION_LABELS[expression]:'')):undefined} aria-hidden={label?undefined:true} data-puppet="felt" data-expression={expression} data-frames={`${frame.body},${frame.eyes},${frame.mouth}`}>
 <defs><clipPath id={neckId}><rect x="-12" y="-24" width="280" height={collarY+29}/></clipPath><clipPath id={noseId}><ellipse cx="128" cy="128" rx="20" ry="20"/></clipPath></defs>
 {layer('outfit',a.outfit,2,7,3)}<g clipPath={`url(#${neckId})`}>{layer('body',frame.body,a.shape,3,6,true)}</g>{layer('eyes',frame.eyes,frame.eyesRow,4,6,true)}{layer('mouth',frame.mouth,frame.mouthRow,4,6,true)}<g clipPath={`url(#${noseId})`}>{layer('nose',frame.body,a.shape,3,6,true)}</g>{a.hair>0&&layer('hair',a.hair,0,7,3)}{a.accessory>0&&layer('accessory',a.accessory,1,7,3)}
 </svg>;
}
