import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {measurePuppets} from '../scripts/puppet-anchors.mjs';
const measured=await measurePuppets();
const baseline=process.argv.includes('--baseline');
if(!baseline)assert.deepEqual(JSON.parse(readFileSync('lib/puppet-registration.json','utf8')),measured,'Atlas artwork changed: rebuild the anchor calibration before publishing');
let placement=()=>({x:0,y:0,scale:1});
if(!baseline){
 const source=readFileSync('lib/puppet-registration.ts','utf8').replace("import registration from './puppet-registration.json';",'const registration='+readFileSync('lib/puppet-registration.json','utf8')+';');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 ({puppetPlacement:placement}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64')));
}
let checked=0;
for(let shape=0;shape<6;shape++)for(let body=0;body<3;body++){
 const head=measured.atlas.body[shape][body];const pose={body,eyes:0,mouth:0,eyesRow:0,mouthRow:0};
 const p=placement('body',body,shape,shape,pose);
 assert.ok(Math.abs(head.nose.x*p.scale+p.x-128)<.25,'The nose must stay on the face axis in every drawn pose');
 assert.ok(Math.abs(head.nose.y*p.scale+p.y-128)<.25,'The nose must keep the same vertical anchor');
 for(let row=0;row<6;row++)for(let col=0;col<4;col++)for(const name of ['eyes','mouth']){
  const m=measured.atlas[name][row][col],p=placement(name,col,row,shape,pose);
  assert.ok(Math.abs(m.center.x*p.scale+p.x-128)<.25,`${name} ${row}/${col} slides away from the nose axis`);
  const actualY=(name==='eyes'?m.bottom:m.center.y)*p.scale+p.y;
  assert.ok(Math.abs(actualY-(name==='eyes'?130:169))<.25,`${name} ${row}/${col} changes its vertical anchor`);checked++;
 }
 for(let hair=1;hair<7;hair++){
  const p=placement('hair',hair,0,shape,pose),m=measured.atlas.parts[0][hair];
  const top=head.forehead+128-head.nose.y;
  assert.ok(Math.abs(m.hairline*p.scaleY+p.y-(top+12))<.25,'Hair detaches from the forehead during a drawn pose');checked++;
 }
 for(let outfit=0;outfit<6;outfit++){
  const p=placement('outfit',outfit,2,shape,pose),m=measured.atlas.parts[2][outfit];
  assert.ok(Math.abs(m.collar*p.scale+p.y-(head.neck+128-head.nose.y-5))<.25,'The collar must follow the native neck');checked++;
 }
}
console.log(`Passed ${checked} geometric alignment checks across all heads and animation frames.`);
