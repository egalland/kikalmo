import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
import {renderPuppet,puppetPose} from './puppet-render.mjs';
mkdirSync('.sites-runtime',{recursive:true});
const profiles=Array.from({length:6},(_,i)=>({shape:i,hair:i<3?0:i+1,eyes:i,mouth:i,accessory:i<3?0:i-2,outfit:i,color:'#d8fc70'}));
const cells=[];
for(let row=0;row<6;row++)for(let col=0;col<6;col++){
 const a=profiles[row];const frame=col<4?{body:col%3,eyes:col,mouth:col,eyesRow:a.eyes,mouthRow:a.mouth}:puppetPose(a.eyes,a.mouth,col===4?'first':'victory',0,0,false);
 const svg=renderPuppet(a,frame,`grid-${row}-${col}`,col===4?'first':col===5?'victory':'idle');
 cells.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:col*256,top:row*256});
}
await sharp({create:{width:1536,height:1536,channels:4,background:'#f5eddc'}}).composite(cells).png().toFile('.sites-runtime/puppet-frames-qa.png');
const frames=[];
for(let i=0;i<28;i++){
 const layers=[];
 for(let j=0;j<2;j++){
  const a={...profiles[j?4:1],hair:j?3:0,eyes:2,mouth:0,accessory:0};
  const svg=renderPuppet(a,puppetPose(a.eyes,a.mouth,'idle',i*250,0),`anim-${i}-${j}`);
  layers.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:j*256,top:0});
 }
 frames.push(await sharp({create:{width:512,height:256,channels:4,background:'#f5eddc'}}).composite(layers).png().toBuffer());
}
await sharp(frames,{join:{animated:true}}).gif({delay:250,loop:0}).toFile('.sites-runtime/puppet-animation-qa.gif');
console.log('Rendered 36 component poses and 28 real animation frames.');
