import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {renderPuppet} from '../scripts/puppet-render.mjs';
const {shapes}=JSON.parse(readFileSync('lib/puppet-morphologies.json','utf8'));
const {data,info}=await sharp('public/puppets/v2/tuft.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
assert.equal(info.width,768);assert.equal(info.height,2304);
const alpha=(shape,pose,x,y)=>data[((shape*384+y)*info.width+pose*256+x)*4+3];
for(const m of shapes){
 let contact=0,top=384;
 for(let y=0;y<384;y++)for(let x=0;x<256;x++)if(alpha(m.shape,m.frame,x,y)>128){top=Math.min(top,y);assert.ok(x>0&&x<255&&y>0&&y<383,'Tuft must have a complete, unclipped silhouette');}
 for(let y=m.forehead+128;y<=m.forehead+138;y++)for(let x=112;x<=144;x++)if(alpha(m.shape,m.frame,x,y)>160)contact++;
 assert.ok(contact>40,`Detached root for head ${m.shape}/${m.frame}`);
 assert.ok(top<95,'Tall tuft must remain recognizably upright');
 const svg=renderPuppet({shape:m.shape,hair:7,eyes:0,nose:1,mouth:0,accessory:0,outfit:1,color:'#ff8eb2'},{body:m.frame,eyes:0,mouth:0,eyesRow:0,mouthRow:0},'tuft','idle',464);
 assert.ok(svg.includes('viewBox="-12 -128 280 464"'));
 assert.ok(svg.includes('puppet-hair'));
 const raster=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let visible=0;for(let x=0;x<raster.info.width;x++)for(let y=0;y<3;y++)visible+=raster.data[(y*raster.info.width+x)*4+3];
 assert.equal(visible,0,'The rendered tip must leave a clear margin above');
}
console.log('Passed: 18 fitted tuft roots, full silhouettes, extended viewports and actual rendered tip margins.');
