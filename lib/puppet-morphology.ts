import morphologies from './puppet-morphologies.json';
export const PUPPET_STAGE=morphologies.stage;
export function morphology(shape:number,body:number){return morphologies.shapes[shape*3+body];}
export function outfitPlacement(shape:number,body:number){const m=morphology(shape,body);const scaleX=Math.max(190,Math.min(242,m.cheek.width*1.65))/232;return {x:128-128*scaleX,y:m.chin-5-82,scaleX,scaleY:1};}
/** Position identity accessories on face/neck landmarks instead of arbitrary offsets. */
export function accessoryTarget(col:number,shape:number,body:number){
 const m=morphology(shape,body);
 if(col===3)return {x:m.brow.right-3,y:m.forehead+25,width:38,height:38};
 if(col===4)return {x:128,y:142,width:m.cheek.width*.68,height:20};
 if(col===5)return {x:128,y:150,width:Math.max(66,Math.min(86,m.jaw.width*.64)),height:30};
 if(col===6)return {x:128,y:m.chin+30,width:92,height:68};
 return {x:128,y:110,width:Math.max(138,Math.min(151,m.bounds.width*.79)),height:64};
}
