import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const morph=JSON.parse(readFileSync('lib/puppet-morphologies.json','utf8'));
const raw=async name=>sharp('public/puppets/v2/'+name+'.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const [heads,hair,outfits,noses]=await Promise.all(['heads','hair','outfits','noses'].map(raw));
const alpha=(a,col,row,x,y)=>a.data[((row*256+y)*a.info.width+col*256+x)*4+3];
let contacts=0;
for(let shape=0;shape<6;shape++)for(let frame=0;frame<3;frame++){
 const m=morph.shapes[shape*3+frame];assert.ok(m.chin<240&&m.chin>175);
 assert.ok(alpha(heads,frame,shape,128,m.chin)>100,'Complete chin must exist in artwork');
 assert.equal(alpha(heads,frame,shape,128,250),0,'No baked long neck that needs cropping');
 for(let style=0;style<6;style++){
  let contact=0;
  // On each face, the continuous fringe must sit on skin, not over a paper-colored gap.
  for(let y=m.forehead+4;y<m.forehead+22;y++)for(let x=105;x<151;x++)if(alpha(heads,frame,shape,x,y)>180&&alpha(hair,style,shape*3+frame,x,y+48)>180)contact++;
  assert.ok(contact>90,`Hair ${style} detached from scalp ${shape}/${frame}`);contacts+=contact;
 }
}
for(let style=0;style<6;style++){
 let bottom=-1,maxWidth=0;const widths=[];
 for(let y=0;y<256;y++){let width=0;for(let x=0;x<256;x++)if(alpha(outfits,style,0,x,y)>128)width++;widths[y]=width;if(width){bottom=y;maxWidth=Math.max(maxWidth,width);}}
 assert.ok(bottom<225,'Hem must have transparent margin below, never end at the sprite border');
 assert.ok(widths[bottom]<maxWidth*.6,'Rounded lower hem, not a flat full-width rectangular crop');
 assert.ok(widths.slice(bottom-6,bottom+1).some(w=>w<maxWidth*.8),'Visible curved lower outline');
}
for(let shape=0;shape<6;shape++){const frames=[];for(let pose=0;pose<3;pose++){const data=[];for(let y=0;y<256;y++)for(let x=0;x<256;x++)data.push(alpha(heads,pose,shape,x,y));frames.push(createHash('sha256').update(Buffer.from(data)).digest('hex'));}assert.equal(new Set(frames).size,3,'Three distinct drawn head outlines in every morphology');}
const hashes=[];for(let nose=0;nose<6;nose++){const pixels=[];for(let y=95;y<160;y++)for(let x=95;x<160;x++)pixels.push(alpha(noses,nose,0,x,y));hashes.push(createHash('sha256').update(Buffer.from(pixels)).digest('hex'));}
assert.equal(new Set(hashes).size,6,'All six selectable nose silhouettes must be distinct');
console.log(`Passed: 108 scalp fittings (${contacts} contact pixels), 18 complete chins, six finished curved hems, and six distinct nose shapes.`);
