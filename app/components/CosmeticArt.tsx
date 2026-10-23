import {COSMETICS} from '../../lib/cosmetics';
import {morphology} from '../../lib/puppet-morphology';
import assets from '../../lib/accessory-assets.json';

const variants:Record<number,string>={2:'hue-rotate(210deg)',4:'hue-rotate(180deg)',6:'sepia(1) saturate(2) brightness(1.8)',8:'sepia(1) saturate(2) hue-rotate(300deg) brightness(.9)',10:'hue-rotate(245deg)',12:'hue-rotate(210deg)',16:'hue-rotate(186deg)',18:'grayscale(.7) sepia(.3) hue-rotate(160deg) brightness(1.18)',20:'hue-rotate(135deg) saturate(.65) brightness(1.05)',22:'hue-rotate(300deg)',24:'hue-rotate(225deg)'};
const boxes:Record<string,{width:number;height:number;bottom?:number;top?:number}>={
 beret:{width:180,height:85,bottom:14},beanie:{width:165,height:150,bottom:18},
 top:{width:185,height:145,bottom:18},pirate:{width:210,height:120,bottom:18},
 antenna:{width:210,height:190,top:-110},headphones:{width:235,height:220,top:-80},
 crown:{width:170,height:125,bottom:18},halo:{width:165,height:65,bottom:-44},
 wizard:{width:190,height:175,bottom:18},bow:{width:100,height:65},star:{width:48,height:48},heart:{width:48,height:48},
};
export default function CosmeticArt({id,shape,body,offsetY=0}:{id?:number;shape:number;body:number;offsetY?:number}){
 const item=COSMETICS.find(c=>c.id===id);if(!item||item.id>=25)return null;
 const m=morphology(shape,body),kind=item.kind==='sparkles'?'star':item.kind;
 const asset=assets.find(a=>a.key===kind);if(!asset)return null;
 const image=(cx:number,cy:number,width:number,height:number,key?:number)=><image key={key} href={asset.url} x={cx-width/2} y={cy-height/2} width={width} height={height} preserveAspectRatio="xMidYMid meet"/>;
 const box=boxes[kind],scale=Math.min(box.width/asset.width,box.height/asset.height),headScale=['bow','star','heart'].includes(kind)?1:Math.max(.94,Math.min(1.12,m.cheek.width/120)),width=asset.width*scale*headScale,height=asset.height*scale*headScale;
 let content;
 if(item.kind==='sparkles')content=[[-94,8,40],[96,46,34],[-99,128,26],[68,-44,28]].map(([x,y,size],i)=>image(128+x,m.forehead+y,size,size,i));
 else if(item.kind==='bow')content=image(128,m.chin+18,width,height);
 else if(item.kind==='star'||item.kind==='heart')content=image(182,m.chin+61,width,height);
 else {const top=Math.max(-120,box.top!==undefined?m.forehead+box.top:m.forehead+(box.bottom||0)-height);content=image(128,top+height/2,width,height);}
 return <g className="puppet-cosmetic" data-cosmetic={item.id} data-material="felt-raster" transform={offsetY?`translate(0 ${offsetY})`:undefined} aria-hidden="true" style={{filter:variants[item.id]||undefined}}>{content}</g>;
}
