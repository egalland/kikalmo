import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
import {renderPuppet,puppetPose} from './puppet-render.mjs';
const out='/workspace/scratch/5553c223ca37/avatar-review';mkdirSync(out,{recursive:true});
const labels=['Rond','Carré','Ovale','Poire','Nuage','Menton'];
const parts={hair:['Mèche rousse','Laine pétrole','Banane dorée','Boucles auburn','Carré de laine','Bonnet marine'],outfit:['Chemise rayée','Pull sauge','Veste prune','Sweat marine','Gilet rouille','Tweed et nœud'],accessory:['Lunettes miel','Lunettes de soleil','Petite fleur','Joues roses','Moustache','Foulard corail'],nose:['Sans nez','Classique ovale','Petit rond','Bouton large','Petite poire','Allongé','Retroussé']};
const text=async(s,w,h,size=20)=>sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w/2}" y="${h*.7}" text-anchor="middle" fill="#30483b" font-family="DejaVu Sans,sans-serif" font-size="${size}" font-weight="bold">${s}</text></svg>`)).png().toBuffer();
for(const [part,names] of Object.entries(parts)){
 const W=1440,H=70+names.length*264,layers=[];
 for(let shape=0;shape<6;shape++)layers.push({input:await text(labels[shape],240,40),left:shape*240,top:0});
 for(let row=0;row<names.length;row++){
  layers.push({input:await text(names[row],1440,30,18),left:0,top:45+row*264});
  for(let shape=0;shape<6;shape++){
   const value={shape,hair:3,eyes:0,nose:1,mouth:0,accessory:0,outfit:5,color:'#f8d779',[part]:part==='hair'||part==='accessory'?row+1:row};
   const svg=renderPuppet(value,{body:0,eyes:0,mouth:0,eyesRow:0,mouthRow:0},`${part}-${row}-${shape}`,'idle',230);
   layers.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:shape*240+5,top:75+row*264});
  }
 }
 await sharp({create:{width:W,height:H,channels:4,background:'#f5eddc'}}).composite(layers).png().toFile(out+'/'+part+'-six-morphologies.png');
 console.log('Rendered '+part+' × six heads');
}
const frames=[];
for(let tick=0;tick<18;tick++){
 const layers=[];
 for(let shape=0;shape<6;shape++){
  const option=Math.floor(tick/3),value={shape,hair:option+1,eyes:shape,nose:option+1,mouth:shape,accessory:option+1,outfit:option,color:['#f8d779','#c8b9ff','#8fe1dd','#ffae92','#d8fc70','#ff8eb2'][shape]};
  const pose={...puppetPose(shape,shape,['idle','😂','🤔','🔥','🦆','🐶'][option],tick*120,0,true),body:tick%3};
  layers.push({input:await sharp(Buffer.from(renderPuppet(value,pose,`anim-${tick}-${shape}`,'idle',240))).png().toBuffer(),left:shape*240,top:0});
 }
 frames.push(await sharp({create:{width:1440,height:240,channels:4,background:'#f5eddc'}}).composite(layers).png().toBuffer());
}
await sharp(frames,{join:{animated:true}}).gif({delay:300,loop:0}).toFile(out+'/morphologies-animation.gif');console.log('Rendered 18 complete animation frames across six heads and all six sets of parts.');
