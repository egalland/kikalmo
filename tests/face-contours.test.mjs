import assert from 'node:assert/strict';
import sharp from 'sharp';
import {renderPuppet,puppetPose,costumePlacement} from '../scripts/puppet-render.mjs';
const c=costumePlacement(25),size=384,scale=Math.min(size/c.stage.width,size/c.stage.height);
const screen=(x,y)=>[Math.round((size-c.stage.width*scale)/2+(x-c.stage.x)*scale),Math.round((size-c.stage.height*scale)/2+(y-c.stage.y)*scale)];
const costume=await sharp('public'+c.url).ensureAlpha().raw().toBuffer();
let verified=0;
for(let shape=0;shape<6;shape++){
 const head=await sharp('public/puppets/v2/heads.webp').extract({left:0,top:shape*256,width:256,height:256}).ensureAlpha().raw().toBuffer();
 const avatar={shape,hair:0,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779',cosmetic:25};
 const svg=renderPuppet(avatar,puppetPose(0,0,'idle',0,0,false),'contour-'+shape,'idle',size);
 const image=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();let samples=0;
 for(let y=55;y<160;y+=6)for(let x=55;x<202;x+=6){
  let clear=true;for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++)if(head[((y+dy)*256+x+dx)*4+3]>4)clear=false;
  if(!clear)continue;
  const wx=128+(x-128)*c.faceScale,wy=122+(y-122)*c.faceScale;
  const ax=Math.round((wx-c.x)/c.scale),ay=Math.round((wy-c.y)/c.scale);
  if(ax<0||ay<0||ax>=c.width||ay>=c.height||costume[(ay*c.width+ax)*4+3]>4)continue;
  const [px,py]=screen(wx,wy),i=(py*size+px)*4;
  if(image[i+3]<200)continue;
  assert.ok(Math.max(image[i],image[i+1],image[i+2])<90,'Skin spills outside the selected head silhouette: shape '+shape+' at '+x+','+y);
  samples++;
 }
 assert.ok(samples>=8,'Enough pixels outside the actual chosen face contour must be checked: '+shape);verified+=samples;
}
console.log('Passed face contours: '+verified+' pixels outside six native head silhouettes show the helmet lining, with no enlarged skin fill.');
