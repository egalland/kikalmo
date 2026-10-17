import registration from './puppet-registration.json';
type Anchor={center:{x:number;y:number};bottom:number;crop:{x:number;y:number;width:number;height:number};scale?:number;nose?:{x:number;y:number};forehead?:number;neck?:number;temple?:number;hairline?:number;collar?:number};
const atlas=registration.atlas as unknown as Record<string,(Anchor|null)[][]>;
/** Registration is fixed for each drawing. Movement still comes from the drawn frames. */
export function puppetPlacement(name:string,col:number,row:number,shape:number,pose:{body:number}){
 const source=name==='hair'||name==='accessory'||name==='outfit'?'parts':name==='nose'?'body':name;
 const a=atlas[source][row][col]!;
 const head=atlas.body[shape][pose.body]!;
 const bodyX=128-head.nose!.x,bodyY=128-head.nose!.y;
 let x=0,y=0,scale=1;
 if(name==='body'||name==='nose'){x=bodyX;y=bodyY;}
 else if(name==='eyes'){scale=a.scale!;x=128-a.center.x*scale;y=130-a.bottom*scale;}
 else if(name==='mouth'){x=128-a.center.x;y=169-a.center.y;}
 else if(name==='hair'){x=128-a.center.x;y=Math.min(head.forehead!+bodyY+14,64)-a.hairline!;}
 else if(name==='outfit'){x=128-a.center.x;y=head.neck!+bodyY+6-a.collar!;}
 else if(name==='accessory'){
  let tx=128,ty=109;
  if(col===3){tx=head.temple!+bodyX+4;ty=head.forehead!+bodyY+25;}
  if(col===4)ty=143;
  if(col===5)ty=145;
  if(col===6)ty=head.neck!+bodyY+12;
  x=tx-a.center.x;y=ty-a.center.y;
 }
 return {x,y,scale,crop:a.crop};
}

/** Top of the collar, also the bottom clipping boundary of the foreground neck. */
export function puppetCollarY(shape:number,pose:{body:number}){
 const head=atlas.body[shape][pose.body]!;
 return head.neck!+128-head.nose!.y+6;
}
