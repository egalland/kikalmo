import assert from 'node:assert/strict';import sharp from 'sharp';import {readFileSync} from 'node:fs';import {renderPuppet,puppetPose} from '../scripts/puppet-render.mjs';
const morph=JSON.parse(readFileSync('lib/puppet-morphologies.json','utf8'));let samples=0;
for(const headwear of [42,45])for(let shape=0;shape<6;shape++){
 const a={shape,hair:1,eyes:4,nose:3,mouth:0,accessory:6,outfit:2,color:'#ff8eb2',headwear};
 const render=async hair=>sharp(Buffer.from(renderPuppet({...a,hair},puppetPose(4,0,'idle',0,0,false),'hat-fit','idle',232))).ensureAlpha().raw().toBuffer();
 const [actual,reference,head]=await Promise.all([render(1),render(0),sharp('public/puppets/v2/heads.webp').extract({left:0,top:shape*256,width:256,height:256}).ensureAlpha().raw().toBuffer()]);
 for(let y=20;y<104;y+=2)for(let x=42;x<216;x+=2){let clear=true;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(head[((y+dy)*256+x+dx)*4+3]>4)clear=false;if(!clear)continue;
  const px=46+(x+12)/2,py=(y+128)/2,k=(py*232+px)*4;for(let c=0;c<4;c++)assert.ok(Math.abs(actual[k+c]-reference[k+c])<=2,'Straight hair end protrudes beyond the head under witch hat '+headwear+'/'+shape);samples++;
 }
}
assert.ok(samples>100);console.log('Passed witch-hat hair: '+samples+' exterior pixels preserve a natural head contour across both variants and six shapes.');
