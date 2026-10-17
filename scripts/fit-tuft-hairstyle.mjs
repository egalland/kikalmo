// Approved blonde tuft -> 18 fitted sprite cells, leaving the existing hairstyles untouched.
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
const {shapes}=JSON.parse(readFileSync('lib/puppet-morphologies.json','utf8'));
const W=256,H=384,Y=-128;
const source='data/puppet-sources/v2/tuft-blond.webp';
const metadata=await sharp(source).metadata();
const layers=[];
for(const m of shapes){
 const height=Math.round(Math.max(150,Math.min(182,m.brow.width*1.25)));
 const width=Math.round(height*metadata.width/metadata.height);
 const {data,info}=await sharp(source).resize(width,height).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Measure the actual wool root rather than centering the whole swept silhouette.
 let sx=0,weight=0;
 for(let y=height-12;y<height;y++)for(let x=0;x<width;x++){
  const a=data[(y*width+x)*4+3];if(a>128){sx+=x*a;weight+=a;}
 }
 const root=sx/weight;
 const x0=128-root,y0=m.forehead+10-Y-height;
 const raw=Buffer.alloc(W*H*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  // Three baked silhouettes, with the base held at the scalp as the body pose changes.
  const bend=[0,-4,4][m.frame]*(1-y/(height-1))**2;
  const tx=Math.round(x0+x+bend),ty=Math.round(y0+y);
  if(tx>=0&&tx<W&&ty>=0&&ty<H)data.copy(raw,(ty*W+tx)*4,(y*info.width+x)*4,(y*info.width+x)*4+4);
 }
 layers.push({input:await sharp(raw,{raw:{width:W,height:H,channels:4}}).png().toBuffer(),left:m.frame*W,top:m.shape*H});
}
await sharp({create:{width:W*3,height:H*6,channels:4,background:'#0000'}}).composite(layers).webp({quality:94,alphaQuality:100}).toFile('public/puppets/v2/tuft.webp');
console.log('Packed blonde tuft for six morphologies and three body poses.');
