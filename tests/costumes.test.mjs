import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {renderPuppet,puppetPose} from '../scripts/puppet-render.mjs';
const assets=JSON.parse(readFileSync('lib/costume-assets.json','utf8'));
assert.equal(assets.length,8);
let rendered=0;
for(const asset of assets){
 const {data,info}=await sharp('public'+asset.url).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,asset.width);assert.equal(info.height,asset.height);
 const cx=Math.round(asset.face.x+asset.face.width/2),cy=Math.round(asset.face.y+asset.face.height/2);
 assert.ok(data[(cy*info.width+cx)*4+3]<16,asset.key+' must preserve a truly transparent face opening');
 assert.ok(data[3]<4,asset.key+' must preserve exterior alpha');
 const stage=asset.stage,size=160,scale=Math.min(size/stage.width,size/stage.height),px=Math.round((size-stage.width*scale)/2+(128-stage.x)*scale),py=Math.round((size-stage.height*scale)/2+(122-stage.y)*scale);
 for(let shape=0;shape<6;shape++){
  const a={shape,hair:7,eyes:shape%6,nose:shape+1,mouth:shape%6,accessory:6,outfit:5,color:'#f8d779',cosmetic:asset.id};
  const svg=renderPuppet(a,puppetPose(a.eyes,a.mouth,'idle',0,0,false),'costume-'+asset.id+'-'+shape,'idle',size);
  assert.match(svg,/data-costume=/);assert.ok(svg.includes('puppet-identity'));assert.ok(svg.includes('puppet-layer puppet-outfit'));assert.ok(svg.includes('puppet-layer puppet-hair'));assert.ok(svg.includes('face-window'));assert.ok(svg.includes('puppet-accessory'));
  const pixels=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
  assert.ok(pixels[(py*size+px)*4+3]>220,asset.key+': shape '+shape+' must fill the face aperture');
  // Nothing touches the canvas edge: large fins, antennae, shoulder pads and hems remain visible.
  for(let n=0;n<size;n++)for(const i of [n,(size-1)*size+n,n*size,n*size+size-1])assert.ok(pixels[i*4+3]<4,asset.key+' clips at the viewport edge');
  rendered++;
 }
 const avatar={shape:0,hair:7,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779',cosmetic:asset.id};
 const idle=await sharp(Buffer.from(renderPuppet(avatar,puppetPose(0,0,'idle',0,0,false),'expressions','idle',size))).raw().toBuffer();
 const win=await sharp(Buffer.from(renderPuppet(avatar,puppetPose(0,0,'victory',0,0,false),'expressions','victory',size))).raw().toBuffer();
 assert.notDeepEqual(idle,win,asset.key+' must retain actual facial expression changes');
}
console.log('Passed costumes: 8 genuine-alpha assets, '+rendered+' rendered morphology fittings, complete unclipped silhouettes, masked original identity and preserved animated expressions.');
for(let costume=25;costume<=32;costume++)for(let shape=0;shape<6;shape++){
 const a={shape,hair:5,eyes:0,nose:1,mouth:0,accessory:1,outfit:0,color:'#f8d779',costume,headwear:7,adornment:15};
 const svg=renderPuppet(a,puppetPose(0,0,'idle',0,0,false),'layered-'+costume+'-'+shape);
 assert.ok(svg.indexOf('puppet-hair')<svg.indexOf('puppet-costume'),'Hair remains inside helmet');assert.ok(svg.indexOf('puppet-accessory')<svg.indexOf('puppet-costume'),'Facial accessories remain inside helmet');assert.ok(svg.indexOf('data-cosmetic="15"')>svg.indexOf('puppet-costume'),'Bow must be in front of costume');assert.ok(svg.includes('data-cosmetic="7"'),'Headwear remains part of underlying identity');
}
console.log('Passed 48 combined costumes: headwear, hair and glasses retained underneath, bow above the costume.');
