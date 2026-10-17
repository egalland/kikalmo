import registration from './puppet-registration.json';
type Span={left:number;right:number;width:number};
type Anchor={center:{x:number;y:number};bottom:number;crop:{x:number;y:number;width:number;height:number};scale?:number;nose?:{x:number;y:number};forehead?:number;neck?:number;temple?:number;hairline?:number;collar?:number;brow?:Span;cheek?:Span;jaw?:Span;neckWidth?:number};
const atlas=registration.atlas as unknown as Record<string,(Anchor|null)[][]>;
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
/** Each drawing supplies its own contour: narrow forehead, cheeks, jaw and neck. */
export function puppetFit(shape:number,pose:{body:number}){
 const head=atlas.body[shape][pose.body]!;
 const dx=128-head.nose!.x,dy=128-head.nose!.y;
 return {forehead:head.forehead!+dy,temple:head.brow!.right+dx,browWidth:head.brow!.width,cheekWidth:head.cheek!.width,jawWidth:head.jaw!.width,neck:head.neck!+dy,neckWidth:head.neckWidth!};
}
/** Registration changes the fit, while movement still comes from the drawn frames. */
export function puppetPlacement(name:string,col:number,row:number,shape:number,pose:{body:number}){
 const source=name==='hair'||name==='accessory'||name==='outfit'?'parts':name==='nose'?'body':name;
 const a=atlas[source][row][col]!;
 const head=atlas.body[shape][pose.body]!,fit=puppetFit(shape,pose);
 const bodyX=128-head.nose!.x,bodyY=128-head.nose!.y;
 let x=0,y=0,scale=1,scaleX=1,scaleY=1;
 const width=a.crop.width-4;
 if(name==='body'||name==='nose'){x=bodyX;y=bodyY;}
 else if(name==='eyes'){scale=a.scale!;scaleX=scaleY=scale;x=128-a.center.x*scale;y=130-a.bottom*scale;}
 else if(name==='mouth'){x=128-a.center.x;y=169-a.center.y;}
 else if(name==='hair'){
  scaleX=clamp(fit.browWidth+70,160,198)/width;scaleY=clamp(scaleX,.8,1);
  x=128-a.center.x*scaleX;y=fit.forehead+12-a.hairline!*scaleY;
 }
 else if(name==='outfit'){
  scaleX=clamp(fit.cheekWidth*1.65,190,242)/width;
  x=128-a.center.x*scaleX;y=puppetCollarY(shape,pose)-a.collar!;
 }
 else if(name==='accessory'){
  let tx=128,ty=109;
  if(col===1||col===2){scaleX=clamp(fit.browWidth+35,130,158)/width;scaleY=clamp(scaleX,.88,1.05);}
  if(col===3){scaleX=scaleY=clamp(fit.browWidth/105,.78,1.12);tx=fit.temple-3;ty=fit.forehead+24;}
  if(col===4){scaleX=fit.cheekWidth*.8/width;scaleY=.85;ty=145;}
  if(col===5){scaleX=clamp(fit.jawWidth*.72,70,98)/width;scaleY=clamp(scaleX,.8,1);ty=148;}
  if(col===6){scaleX=clamp(fit.neckWidth*1.65,68,86)/width;scaleY=.85;ty=fit.neck-7+(a.center.y-a.crop.y)*scaleY;}
  x=tx-a.center.x*scaleX;y=ty-a.center.y*scaleY;
 }
 return {x,y,scale,scaleX,scaleY,crop:a.crop};
}
/** Collar overlaps the narrow neck, behind the chin, rather than floating below it. */
export function puppetCollarY(shape:number,pose:{body:number}){return puppetFit(shape,pose).neck-5;}
