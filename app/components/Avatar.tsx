'use client';
import hairstyles from '../../lib/hair-assets.json';
import CosmeticArt from './CosmeticArt';
import {costumePlacement} from '../../lib/costumes';
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
 const a=cleanAvatar(value),id=useId();const tick=useSyncExternalStore(animated?subscribe:noSubscribe,animated?read:zero,zero);const seed=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),a.shape*11+a.hair*7);const expression=emotion||'idle';const frame=puppetPose(a.premiumEyes===36?0:a.premiumEyes===37?2:a.premiumEyes===38?1:a.eyes,a.mouth,expression,tick,seed,animated&&tick>0);
 return <PuppetArt value={a} frame={frame} id={id} className={className} label={label} expression={expression}/>;
}
export function PuppetArt({value,frame,id,className='',label,expression='idle'}:{value:AvatarData;frame:ReturnType<typeof puppetPose>;id:string;className?:string;label?:string;expression?:string}){
 const a=cleanAvatar(value),color=feltColor(a.color),m=morphology(a.shape,frame.body),outfit=outfitPlacement(a.shape,frame.body),costume=costumePlacement(a.costume),stage=costume?costume.stage:(a.headwear||a.adornment||a.premiumHair)?{...PUPPET_STAGE,y:-128,height:464}:a.hair===7?{...PUPPET_STAGE,y:-128,height:464}:PUPPET_STAGE;
 const art=(name:string,file:string,col:number,row:number,columns:number,rows:number,x=0,y=0,scaleX=1,scaleY=1,tint=false)=>
  <svg key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" x={x} y={y} width={256*scaleX} height={256*scaleY} viewBox={`${col*256} ${row*256} 256 256`} overflow="hidden" preserveAspectRatio="none" style={tint?{filter:color}:undefined}><image href={'/puppets/v2/'+file+'.webp'} x="0" y="0" width={columns*256} height={rows*256}/></svg>;
 const face=(name:string,col:number,row:number)=>{const {x,y,scaleX,scaleY,crop}=puppetPlacement(name,col,row,a.shape,frame);return <svg key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" x={x+crop.x*scaleX} y={y+crop.y*scaleY} width={crop.width*scaleX} height={crop.height*scaleY} viewBox={`${col*256+crop.x} ${row*256+crop.y} ${crop.width} ${crop.height}`} overflow="hidden" preserveAspectRatio="none" style={{filter:color}}><image href={'/puppets/'+name+'.webp?v=5'} width="1024" height="1536"/></svg>;};
 const accessory=()=>{const p=puppetPlacement('accessory',a.accessory,1,a.shape,frame),t=accessoryTarget(a.accessory,a.shape,frame.body);const sx=t.width/(p.crop.width-4),sy=t.height/(p.crop.height-4);return <svg className="puppet-layer puppet-accessory" aria-hidden="true" x={t.x-t.width/2-2*sx} y={t.y-t.height/2-2*sy} width={p.crop.width*sx} height={p.crop.height*sy} viewBox={`${a.accessory*256+p.crop.x} ${256+p.crop.y} ${p.crop.width} ${p.crop.height}`} preserveAspectRatio="none" overflow="hidden"><image href="/puppets/parts.webp?v=5" width="1792" height="768"/></svg>;};
 const rear=[9,10,11,12].includes(a.headwear||0),cap=[1,2,3,4,5,6,7,8,21,22,42,45].includes(a.headwear||0);
 const hairAsset=hairstyles.find(h=>h.key===(a.premiumHair===34?'braids':'afro'));
 const hair=()=>a.premiumHair&&hairAsset?<svg className="puppet-layer puppet-hair premium-hair" x={a.premiumHair===34?28:28} y={a.premiumHair===34?m.forehead-45:m.forehead-82} width="200" height={a.premiumHair===34?240:135} viewBox={`0 0 ${hairAsset.width} ${hairAsset.height}`} preserveAspectRatio="xMidYMid meet" style={a.premiumHair===35?{filter:'grayscale(1) brightness(2.2) contrast(.6)'}:undefined}><image href={hairAsset.url} width={hairAsset.width} height={hairAsset.height}/></svg>:a.hair===7?<svg className="puppet-layer puppet-hair" aria-hidden="true" x="0" y="-128" width="256" height="384" viewBox={`${frame.body*256} ${a.shape*384} 256 384`} overflow="hidden"><image href="/puppets/v2/tuft.webp" width="768" height="2304"/></svg>:a.hair>0?art('hair','hair',a.hair-1,a.shape*3+frame.body,6,18,0,-48):null;
 const iris=a.premiumEyes===36?[.08,.43,.52]:a.premiumEyes===37?[.43,.16,.56]:[.1,.4,.23];
 const identity=<g className="puppet-identity" data-face-shape={a.shape}>
  {art('neck','neck',0,0,1,1,0,m.chin-10-198,1,1,true)}
  {art('outfit','outfits',a.outfit,0,6,1,outfit.x,outfit.y,outfit.scaleX)}
  {rear&&<CosmeticArt id={a.headwear} shape={a.shape} body={frame.body}/>}
  {art('body','heads',frame.body,a.shape,3,6,0,0,1,1,true)}
  {a.fabric&&<g className="puppet-fabric" data-fabric={a.fabric} mask={'url(#'+id+'-fabric-face)'}><rect x="0" y="0" width="256" height="256" fill={a.fabric===48?'#ce7135':'#51406e'} opacity=".45"/><rect x="0" y="0" width="256" height="256" fill={'url(#'+id+'-fabric-knit)'} opacity=".65"/></g>}
  <g filter={a.premiumEyes?'url(#'+id+'-iris)':undefined}>{face('eyes',frame.eyes,frame.eyesRow)}</g>{face('mouth',frame.mouth,frame.mouthRow)}
  {a.nose>0&&art('nose','noses',a.nose-1,0,6,1)}
  <g transform={cap?`translate(128 ${m.forehead+16}) scale(.88 .86) translate(-128 ${-m.forehead-16})`:undefined} clipPath={cap?'url(#'+id+'-hat-hair)':undefined}>{hair()}</g>
  {!rear&&<CosmeticArt id={a.headwear} shape={a.shape} body={frame.body}/>}
  {a.accessory>0&&accessory()}
 </g>;
 const adornmentOffset=costume&&a.adornment&&[13,14,15,16,43,44,46].includes(a.adornment)?([15,16,43].includes(a.adornment)?122+costume.faceHeight/2+28-(m.chin+18):costume.y+(costume.bounds.y+costume.bounds.height*.79)*costume.scale-(m.chin+61)):0;
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox={`${stage.x} ${stage.y} ${stage.width} ${stage.height}`} width="256" height="256" preserveAspectRatio="xMidYMid meet" className={'cartoon-avatar felt-avatar '+className} role={label?'img':undefined} aria-label={label?(label+(EXPRESSION_LABELS[expression]?' — '+EXPRESSION_LABELS[expression]:'')):undefined} aria-hidden={label?undefined:true} data-puppet="felt" data-expression={expression} data-frames={`${frame.body},${frame.eyes},${frame.mouth}`} data-nose={a.nose} data-costume-slot={a.costume} data-premium-eyes={a.premiumEyes}>
  <defs>
   {a.fabric&&<><mask id={id+'-fabric-face'} maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256" style={{maskType:'alpha'}}>{art('fabric-mask','heads',frame.body,a.shape,3,6)}</mask><pattern id={id+'-fabric-knit'} width="44" height="44" patternUnits="userSpaceOnUse"><path d="M0 10l4 3 4-3m14 22l4 3 4-3" fill="none" stroke={a.fabric===48?'#f8cf80':'#c3b0d4'} strokeWidth="1.1"/><image href={a.fabric===48?'/puppets/accessories-v2/pumpkinpin.webp':'/puppets/accessories-v2/star.webp'} x="17" y="4" width="14" height="14"/></pattern></>}
   {cap&&<clipPath id={id+'-hat-hair'}><path d={`M-32 ${m.forehead+35} Q128 ${m.forehead-18} 288 ${m.forehead+35} V360 H-32Z`}/></clipPath>}
   {a.premiumEyes&&<filter id={id+'-iris'} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={`${1-iris[0]} 0 0 0 ${iris[0]} 0 ${1-iris[1]} 0 0 ${iris[1]} 0 0 ${1-iris[2]} 0 ${iris[2]} 0 0 0 1 0`}/></filter>}
  </defs>
  {costume?<>
   <defs><filter id={id+'-face-alpha'} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1 1"/></filter>
    <mask id={id+'-face-window'} maskUnits="userSpaceOnUse" x={128-costume.faceWidth/2-1} y={122-costume.faceHeight/2-1} width={costume.faceWidth+2} height={costume.faceHeight+2} style={{maskType:'alpha'}}><image href={costume.url} x={costume.x} y={costume.y} width={costume.renderWidth} height={costume.renderHeight} filter={'url(#'+id+'-face-alpha)'}/></mask></defs>
   <g mask={'url(#'+id+'-face-window)'}><g transform={`translate(128 122) scale(${costume.faceScale}) translate(-128 -122)`}>
    <g className="puppet-helmet-lining" transform="translate(128 122) scale(2.2 1.6) translate(-128 -122)" style={{filter:'grayscale(1) brightness(.16)'}}>{art('helmet-lining','heads',0,0,3,6)}</g>
    {identity}
   </g></g>
   <image className="puppet-costume" data-costume={costume.id} href={costume.url} x={costume.x} y={costume.y} width={costume.renderWidth} height={costume.renderHeight}/>
  </>:identity}
  <CosmeticArt id={a.adornment} shape={a.shape} body={frame.body} offsetY={adornmentOffset}/>
 </svg>;
}
