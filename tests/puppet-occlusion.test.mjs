import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {renderPuppet} from '../scripts/puppet-render.mjs';
const morph=JSON.parse(readFileSync('lib/puppet-morphologies.json','utf8'));
const pixels=svg=>sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();let checked=0;
for(let shape=0;shape<6;shape++)for(let body=0;body<3;body++)for(const outfit of [0,3,5]){
 const a={shape,hair:0,eyes:0,nose:0,mouth:0,accessory:0,outfit,color:'#d8fc70'},frame={body,eyes:0,mouth:0,eyesRow:0,mouthRow:0};
 let svg=renderPuppet(a,frame,'overlap','idle',376);
 assert.doesNotMatch(svg,/<clipPath/,'The entire head must stay intact: no horizontal chin/neck clipping');
 // Stress a collar raised 25 native pixels: the full chin must still be foreground.
 svg=svg.replace(/(<svg[^>]*class="puppet-layer puppet-outfit"[^>]* y=")([^"]+)(")/,(_,a,y,b)=>a+(Number(y)-25)+b);
 const isolate=name=>{const layer=svg.match(new RegExp('<svg[^>]*class="puppet-layer puppet-'+name+'"[^>]*>[\\s\\S]*?<\\/svg>'))?.[0];assert.ok(layer);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -40 280 376" width="376" height="376">${layer}</svg>`;};
 const [full,head,clothes,mouth]=await Promise.all([pixels(svg),pixels(isolate('body')),pixels(isolate('outfit')),pixels(isolate('mouth'))]);
 const chin=morph.shapes[shape*3+body].chin;
 for(let y=chin-20;y<=chin;y++)for(let x=70;x<190;x++){
  const k=((y+40)*376+x+60)*4;
  if(head[k+3]<251||clothes[k+3]<220||mouth[k+3]>8)continue;
  for(let c=0;c<3;c++)assert.ok(Math.abs(full[k+c]-head[k+c])<=5,'Garment covers an intact chin pixel');checked++;
 }
}
assert.ok(checked>100,'Fixtures must exercise actual chin/collar overlap');console.log(`Passed: ${checked} overlapping pixels preserve the complete chin across all 18 head poses.`);
