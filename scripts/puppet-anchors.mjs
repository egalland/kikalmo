import sharp from 'sharp';
export const SIZE=256;
export const GRIDS={body:[3,6],eyes:[4,6],mouth:[4,6],parts:[7,3]};
export async function measurePuppets(root='public/puppets'){
 const atlas={};
 for(const [name,[cols,rows]] of Object.entries(GRIDS)){
  const {data,info}=await sharp(root+'/'+name+'.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  atlas[name]=[];
  for(let r=0;r<rows;r++){
   const row=[];
   for(let c=0;c<cols;c++){
    // The sleepy-eyes sheet contains an unrelated sliver below its two eyes.
    const limit=name==='eyes'&&r===4?116:SIZE;
    const pixel=(x,y)=>{const k=((r*SIZE+y)*info.width+c*SIZE+x)*4;return data.subarray(k,k+4)};
    const on=(x,y)=>x>=0&&x<SIZE&&y>=0&&y<limit&&pixel(x,y)[3]>128;
    let l=SIZE,t=SIZE,right=-1,b=-1;
    for(let y=0;y<limit;y++)for(let x=0;x<SIZE;x++)if(on(x,y)){l=Math.min(l,x);t=Math.min(t,y);right=Math.max(right,x);b=Math.max(b,y);}
    if(right<0){row.push(null);continue;}
    const v={center:{x:(l+right)/2,y:(t+b)/2},bottom:b,crop:{x:Math.max(0,l-2),y:Math.max(0,t-2),width:Math.min(SIZE,right+3)-Math.max(0,l-2),height:Math.min(limit,b+3)-Math.max(0,t-2)}};
    if(name==='body'){
     let n=0,sx=0,sy=0;
     for(let y=90;y<162;y++)for(let x=94;x<164;x++){const [red,g,blue,a]=pixel(x,y);if(a>100&&red>g*1.18&&red>blue*1.2&&g<blue*1.85&&red>75){n++;sx+=x;sy+=y;}}
     if(n<100)throw Error('Nose not found in body '+r+'/'+c);
     v.nose={x:sx/n,y:sy/n};
     for(let y=0;y<150;y++)if(Array.from({length:33},(_,i)=>on(112+i,y)).filter(Boolean).length>14){v.forehead=y;break;}
     for(let y=170;y<240;y++)if([0,1,2].every(dy=>Array.from({length:200},(_,i)=>on(28+i,y+dy)).filter(Boolean).length>=20&&Array.from({length:200},(_,i)=>on(28+i,y+dy)).filter(Boolean).length<60)){v.neck=y;break;}
     if(v.neck===undefined)throw Error('Neck not found in body '+r+'/'+c);
     let side=128;for(let x=128;x<230;x++)if(on(x,v.forehead+25))side=x;v.temple=side;
    }
    if(name==='parts'&&r===0){for(let y=0;y<150;y++)if(Array.from({length:33},(_,i)=>on(112+i,y)).filter(Boolean).length>14)v.hairline=y;}
    if(name==='parts'&&r===2){for(let y=150;y<240;y++)if(Array.from({length:33},(_,i)=>on(112+i,y)).filter(Boolean).length>14){v.collar=y;break;}}
    row.push(v);
   }
   atlas[name].push(row);
  }
 }
 for(const row of atlas.eyes){const width=Math.max(...row.map(v=>v.crop.width-4)),height=Math.max(...row.map(v=>v.crop.height-4));const scale=Math.min(96/width,64/height);for(const v of row)v.scale=scale;}
 return {version:1,atlas};
}
