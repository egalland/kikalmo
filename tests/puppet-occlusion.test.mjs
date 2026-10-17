import assert from 'node:assert/strict';
import sharp from 'sharp';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {renderPuppet} from '../scripts/puppet-render.mjs';
const source=readFileSync('lib/puppet-registration.ts','utf8').replace("import registration from './puppet-registration.json';",'const registration='+readFileSync('lib/puppet-registration.json','utf8')+';');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {puppetCollarY}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const pixels=svg=>sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
let checked=0;
for(const [shape,body] of [[0,0],[1,1],[3,0],[4,2],[5,0]])for(const outfit of [3,5]){
 const a={shape,hair:0,eyes:0,mouth:0,accessory:0,outfit,color:'#d8fc70'},frame={body,eyes:0,mouth:0,eyesRow:0,mouthRow:0};
 // Raise the rendered collar by 16 units to stress the layering with an oversized garment.
 let svg=renderPuppet(a,frame,'overlap','idle',280);
 svg=svg.replace(/(<svg[^>]*class="puppet-layer puppet-outfit"[^>]* y=")([^"]+)(")/,(_,before,y,after)=>before+(Number(y)-16)+after);
 const isolated=name=>{const layer=svg.match(new RegExp('<svg[^>]*class="puppet-layer puppet-'+name+'"[^>]*>[\\s\\S]*?<\\/svg>'))?.[0];assert.ok(layer);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -24 280 280" width="280" height="280">${layer}</svg>`;};
 const [full,head,clothes,mouth]=await Promise.all([pixels(svg),pixels(isolated('body')),pixels(isolated('outfit')),pixels(isolated('mouth'))]);
 for(let y=204;y<puppetCollarY(shape,frame)+24-1;y++)for(let x=97;x<187;x++){
  const k=(Math.floor(y)*280+x)*4;
  if(head[k+3]<251||clothes[k+3]<220||mouth[k+3]>8)continue;
  if(Math.max(...[0,1,2].map(i=>Math.abs(head[k+i]-clothes[k+i])))<25)continue;
  for(let c=0;c<3;c++)assert.ok(Math.abs(full[k+c]-head[k+c])<=5,'A garment pixel covers the foreground chin or neck');checked++;
 }
}
assert.ok(checked>20,'Fixture must exercise real overlapping garment/head pixels');
console.log(`Passed: ${checked} overlapping pixels keep the chin/neck in front of an oversized collar.`);
