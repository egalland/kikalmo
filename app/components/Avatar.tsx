'use client';
import {useId,useSyncExternalStore} from 'react';
import {cleanAvatar,type Avatar as AvatarData} from '../../lib/profile';
import {feltColor,puppetPose,EXPRESSION_LABELS} from '../../lib/puppet';
import {puppetPlacement} from '../../lib/puppet-registration';
import {morphology,outfitPlacement,accessoryTarget,PUPPET_STAGE} from '../../lib/puppet-morphology';

const listeners=new Set<()=>void>();let timer:ReturnType<typeof setInterval>|undefined;let time=0;let motion:MediaQueryList|undefined;
const zero=()=>0;const read=()=>time;const noSubscribe=()=>()=>{};
function updateClock(){if(timer){clearInterval(timer);timer=undefined;}if(listeners.size&&!document.hidden&&!motion?.matches){time=performance.now();timer=setInterval(()=>{time=performance.now();listeners.forEach(f=>f());},100);}else if(motion?.matches){time=0;listeners.forEach(f=>f());}}
function subscribe(listener:()=>void){listeners.add(listener);if(listeners.size===1){motion=window.matchMedia('(prefers-reduced-motion: reduce)');document.addEventListener('visibilitychange',updateClock);motion.addEventListener('change',updateClock);updateClock();}return()=>{listeners.delete(listener);if(!listeners.size){if(timer)clearInterval(timer);timer=undefined;document.removeEventListener('visibilitychange',updateClock);motion?.removeEventListener('change',updateClock);}};}
export default function Avatar({value,className='',label,animated=true,emotion}:{value?:AvatarData;className?:string;label?:string;animated?:boolean;emotion?:string}){
 const a=cleanAvatar(value),id=useId();const tick=useSyncExternalStore(animated?subscribe:noSubscribe,animated?read:zero,zero);const seed=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),a.shape*11+a.hair*7);const expression=emotion||'idle';const frame=puppetPose(a.eyes,a.mouth,expression,tick,seed,animated&&tick>0);
 return <PuppetArt value={a} frame={frame} id={id} className={className} label={label} expression={expression}/>;
}
export function PuppetArt({value,frame,id,className='',label,expression='idle'}:{value:AvatarData;frame:ReturnType<typeof puppetPose>;id:string;className?:string;label?:string;expression?:string}){
 const a=cleanAvatar(value),color=feltColor(a.color),m=morphology(a.shape,frame.body),outfit=outfitPlacement(a.shape,frame.body);
 const art=(name:string,file:string,col:number,row:number,columns:number,rows:number,x=0,y=0,scaleX=1,scaleY=1,tint=false)=>
  <svg key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" x={x} y={y} width={256*scaleX} height={256*scaleY} viewBox={`${col*256} ${row*256} 256 256`} overflow="hidden" preserveAspectRatio="none" style={tint?{filter:color}:undefined}><image href={'/puppets/v2/'+file+'.webp'} x="0" y="0" width={columns*256} height={rows*256}/></svg>;
 const face=(name:string,col:number,row:number)=>{const {x,y,scaleX,scaleY,crop}=puppetPlacement(name,col,row,a.shape,frame);return <svg key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" x={x+crop.x*scaleX} y={y+crop.y*scaleY} width={crop.width*scaleX} height={crop.height*scaleY} viewBox={`${col*256+crop.x} ${row*256+crop.y} ${crop.width} ${crop.height}`} overflow="hidden" preserveAspectRatio="none" style={{filter:color}}><image href={'/puppets/'+name+'.webp?v=5'} width="1024" height="1536"/></svg>;};
 const accessory=()=>{const p=puppetPlacement('accessory',a.accessory,1,a.shape,frame),t=accessoryTarget(a.accessory,a.shape,frame.body);const sx=t.width/(p.crop.width-4),sy=t.height/(p.crop.height-4);return <svg className="puppet-layer puppet-accessory" aria-hidden="true" x={t.x-t.width/2-2*sx} y={t.y-t.height/2-2*sy} width={p.crop.width*sx} height={p.crop.height*sy} viewBox={`${a.accessory*256+p.crop.x} ${256+p.crop.y} ${p.crop.width} ${p.crop.height}`} preserveAspectRatio="none" overflow="hidden"><image href="/puppets/parts.webp?v=5" width="1792" height="768"/></svg>;};
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${PUPPET_STAGE.x} ${PUPPET_STAGE.y} ${PUPPET_STAGE.width} ${PUPPET_STAGE.height}`} width="256" height="256" preserveAspectRatio="xMidYMid meet" className={'cartoon-avatar felt-avatar '+className} role={label?'img':undefined} aria-label={label?(label+(EXPRESSION_LABELS[expression]?' — '+EXPRESSION_LABELS[expression]:'')):undefined} aria-hidden={label?undefined:true} data-puppet="felt" data-expression={expression} data-frames={`${frame.body},${frame.eyes},${frame.mouth}`} data-nose={a.nose}>
  {art('neck','neck',0,0,1,1,0,m.chin-10-198,1,1,true)}
  {art('outfit','outfits',a.outfit,0,6,1,outfit.x,outfit.y,outfit.scaleX)}
  {art('body','heads',frame.body,a.shape,3,6,0,0,1,1,true)}
  {face('eyes',frame.eyes,frame.eyesRow)}{face('mouth',frame.mouth,frame.mouthRow)}
  {a.nose>0&&art('nose','noses',a.nose-1,0,6,1)}
  {a.hair>0&&art('hair','hair',a.hair-1,a.shape*3+frame.body,6,18,0,-48)}
  {a.accessory>0&&accessory()}
 </svg>;
}
