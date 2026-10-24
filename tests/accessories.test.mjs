import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {renderPuppet,puppetPose} from '../scripts/puppet-render.mjs';
const assets=JSON.parse(readFileSync('lib/accessory-assets.json','utf8'));
assert.equal(assets.length,15);
for(const asset of assets){
 const {data,info}=await sharp('public'+asset.url).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(info.width,asset.width);assert.equal(info.height,asset.height);
 const opaque=[],transparent=[];for(let i=0;i<info.width*info.height;i++){if(data[i*4+3]>220)opaque.push(data[i*4]);if(data[i*4+3]<4)transparent.push(i);}
 assert.ok(opaque.length>5000&&transparent.length>100,'Real textured object and genuine alpha: '+asset.key);
 const mean=opaque.reduce((a,b)=>a+b,0)/opaque.length;assert.ok(opaque.reduce((sum,v)=>sum+(v-mean)**2,0)/opaque.length>150,'Material shading must not be a flat fill: '+asset.key);
}
for(let id=1;id<=24;id++){
 const avatar={shape:(id-1)%6,hair:7,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779',cosmetic:id};
 const svg=renderPuppet(avatar,puppetPose(0,0,'idle',0,0,false),'accessory-'+id,'idle',192);
 assert.match(svg,/data-material="felt-raster"/);assert.ok(!svg.includes('/puppets/accessories-v2/'),'Every accessory texture must resolve for raster QA');
 const {data}=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let n=0;n<192;n++)for(const i of [n,191*192+n,n*192,n*192+191])assert.ok(data[i*4+3]<8,'Accessory silhouette clipped: '+id);
}
// Headbands and large headphones belong behind the head, so all chosen eyes stay fully visible.
const size=256,scale=size/464,left=(size-280*scale)/2;
const rect={left:Math.ceil(left+(98+12)*scale),top:Math.ceil((98+128)*scale),width:Math.floor(60*scale),height:Math.floor(30*scale)};
for(const id of [9,10,11,12])for(let shape=0;shape<6;shape++){
 const avatar={shape,hair:1,eyes:shape,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779',cosmetic:id};
 const frame=puppetPose(shape,0,'idle',0,0,false);
 const render=async a=>sharp(Buffer.from(renderPuppet(a,frame,'eyes','idle',size))).extract(rect).raw().toBuffer();
 const actual=await render(avatar),reference=await render({...avatar,cosmetic:13});let difference=0,maximum=0;
 for(let i=0;i<actual.length;i++){const delta=Math.abs(actual[i]-reference[i]);difference+=delta;maximum=Math.max(maximum,delta);}
 // Subtle alpha fibres in the native face can show a few background RGB levels; no opaque headgear may cross the eyes.
 assert.ok(difference/actual.length<1&&maximum<12,'Headgear obscures the eyes: '+id+'/'+shape+' mean='+difference/actual.length+' max='+maximum);
}
console.log('Passed accessories: 12 real textured/alpha assets, 24 complete raster appearances and 24 unobstructed eye-region comparisons across all six head shapes.');
