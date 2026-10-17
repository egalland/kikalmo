import assert from 'node:assert/strict';
import sharp from 'sharp';
import {renderPuppet} from '../scripts/puppet-render.mjs';
const a={shape:1,hair:0,eyes:0,mouth:0,accessory:0,outfit:4,color:'#d8fc70'};
let rendered=0;
for(const size of [32,54,120,270])for(let body=0;body<3;body++)for(let col=0;col<4;col++){
 const svg=renderPuppet(a,{body,eyes:col,mouth:col,eyesRow:0,mouthRow:0},'raster','idle',size);
 for(const name of ['eyes','mouth']){
  const layer=svg.match(new RegExp('<svg[^>]*class="puppet-layer puppet-'+name+'"[^>]*>[\\s\\S]*?<\\/svg>'))?.[0];assert.ok(layer);
  const isolated=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -40 280 376" width="${size}" height="${size}">${layer}</svg>`;
  const {data,info}=await sharp(Buffer.from(isolated)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let l=size,t=size,r=-1,b=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  assert.ok(r>=0,'The actual component must render the selected drawing');
  assert.ok(Math.abs((l+r+1)/2-size/2)<1.25,`${name} shifts horizontally at ${size}px in animation frame ${col}`);
  const actualY=name==='eyes'?b+1:(t+b+1)/2,expectedY=(name==='eyes'?170:209)*size/376;
  assert.ok(Math.abs(actualY-expectedY)<1.25,`${name} shifts vertically at ${size}px in animation frame ${col}`);rendered++;
 }
}
console.log(`Passed ${rendered} actual SVG-to-pixel layer renders at 32, 54, 120 and 270px.`);
