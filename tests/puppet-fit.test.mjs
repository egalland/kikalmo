import assert from 'node:assert/strict';
import sharp from 'sharp';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {renderPuppet} from '../scripts/puppet-render.mjs';
const src=readFileSync('lib/puppet-registration.ts','utf8').replace("import registration from './puppet-registration.json';",'const registration='+readFileSync('lib/puppet-registration.json','utf8')+';');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {puppetFit,puppetPlacement}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let checked=0;const widths={hair:new Set(),accessory:new Set(),outfit:new Set()};
for(let shape=0;shape<6;shape++)for(let body=0;body<3;body++)for(const name of ['hair','accessory','outfit'])for(let option=0;option<6;option++){
 const col=name==='outfit'?option:option+1,pose={body,eyes:0,mouth:0,eyesRow:0,mouthRow:0};
 const p=puppetPlacement(name,col,name==='hair'?0:name==='outfit'?2:1,shape,pose),fit=puppetFit(shape,pose);
 assert.ok([p.x,p.y,p.scaleX,p.scaleY].every(Number.isFinite));assert.ok(p.scaleX>.4&&p.scaleX<1.6);assert.ok(p.scaleY>.6&&p.scaleY<1.6);
 const a={shape,hair:0,eyes:0,mouth:0,accessory:0,outfit:0,color:'#f8d779',[name]:col};
 const svg=renderPuppet(a,pose,'fit','idle',280);
 const layer=svg.match(new RegExp('<svg[^>]*class="puppet-layer puppet-'+name+'"[^>]*>[\\s\\S]*?<\\/svg>'))[0];
 const isolated=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -24 280 280" width="280" height="280">${layer}</svg>`;
 const raw=await sharp(Buffer.from(isolated)).ensureAlpha().raw().toBuffer();let l=280,r=-1,t=280,b=-1;
 for(let y=0;y<280;y++)for(let x=0;x<280;x++)if(raw[(y*280+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 assert.ok(r>l&&b>t,`${name} visible for every head and pose`);
 if(name==='outfit'){assert.ok(l>=10&&r<=270,'Shoulders stay within the portrait');assert.ok(t<fit.neck+24,'Garment reaches the neck');}
 if(name==='accessory'&&col===6)assert.ok(t>=fit.neck+24-9,'Scarf must stay below the chin, away from the mouth');
 if(name==='accessory'&&col===4)assert.ok(t>150,'Blush stays on the cheeks');
 if(body===0&&option===0)widths[name].add(r-l);checked++;
}
for(const name of Object.keys(widths))assert.ok(widths[name].size>=3,`${name} must actually change width with the head shape`);
console.log(`Passed: ${checked} real raster fits over all six heads and three poses, including scarf clearance and fitted shoulders.`);
