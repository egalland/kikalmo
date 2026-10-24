import assert from 'node:assert/strict';import sharp from 'sharp';import {renderPuppet} from '../scripts/puppet-render.mjs';
let tested=0;
for(let shape=0;shape<6;shape++)for(let body=0;body<3;body++){
 const frame={body,eyes:0,mouth:0,eyesRow:0,mouthRow:0},a={shape,hair:1,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779'};
 const base=renderPuppet(a,frame,'accessory-fit','idle',160),pixels=await sharp(Buffer.from(base)).ensureAlpha().raw().toBuffer();
 const nose=base.match(/<svg[^>]*class="puppet-layer puppet-nose"[^>]*>[\s\S]*?<\/svg>/)[0];
 const mask=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -40 280 376" width="160" height="160">${nose}</svg>`)).ensureAlpha().raw().toBuffer();
 for(const accessory of [1,2,3,4,5,6]){
  const svg=renderPuppet({...a,accessory},frame,'accessory-fit','idle',160);assert.equal((svg.match(/data-default-accessory=/g)||[]).length,1);
  if(accessory!==4){const tag=svg.match(/<svg[^>]*data-default-accessory="\d"[^>]*>/)[0],width=Number(tag.match(/ width="([^"]+)"/)[1]),height=Number(tag.match(/ height="([^"]+)"/)[1]),box=tag.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);assert.ok(Math.abs(width/height-box[2]/box[3])<1e-8,'Textile accessory must retain original proportions');}
  if([1,2,5,6].includes(accessory)){const rendered=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();for(let i=0;i<160*160;i++)if(mask[i*4+3]>=250){for(let c=0;c<3;c++)assert.ok(Math.abs(rendered[i*4+c]-pixels[i*4+c])<=8,'Accessory may not paint over the selected nose');tested++;}}
  if(accessory===6)assert.ok(svg.indexOf('data-default-accessory="6"')<svg.indexOf('puppet-body'),'Scarf belongs behind the chin');
 }
}
assert.ok(tested>500);console.log('Passed default accessories: 108 fittings, undistorted native material, scarf behind chin and '+tested+' protected nose pixels.');
