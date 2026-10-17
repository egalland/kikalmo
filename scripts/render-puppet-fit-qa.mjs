import sharp from 'sharp';
import {renderPuppet} from './puppet-render.mjs';
for(const part of ['hair','accessory','outfit']){
 const cells=[];
 for(let option=0;option<6;option++)for(let shape=0;shape<6;shape++){
  const a={shape,hair:0,eyes:0,mouth:0,accessory:0,outfit:0,color:'#f8d779',[part]:part==='outfit'?option:option+1};
  const svg=renderPuppet(a,{body:0,eyes:0,mouth:0,eyesRow:0,mouthRow:0},`${part}-${option}-${shape}`,'idle',200);
  cells.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:shape*200,top:option*200});
 }
 await sharp({create:{width:1200,height:1200,channels:4,background:'#f5eddc'}}).composite(cells).png().toFile(`.sites-runtime/puppet-${part}-fit.png`);
}
console.log('Rendered all 108 head/hair, head/accessory and head/outfit combinations.');
