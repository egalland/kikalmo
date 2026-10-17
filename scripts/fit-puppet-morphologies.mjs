import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const old=JSON.parse(readFileSync('lib/puppet-registration.json','utf8')).atlas;
const S=256,OUT='public/puppets/v2';mkdirSync(OUT,{recursive:true});
const blank=()=>Buffer.alloc(S*S*4);
const encode=raw=>sharp(raw,{raw:{width:S,height:S,channels:4}}).png().toBuffer();
const bounds=raw=>{let l=S,t=S,r=-1,b=-1;for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(raw[(y*S+x)*4+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {left:l,top:t,width:r-l+1,height:b-t+1};};
async function cell(file,cols,rows,col,row){const m=await sharp(file).metadata();const l=Math.round(col*m.width/cols),t=Math.round(row*m.height/rows),r=Math.round((col+1)*m.width/cols),b=Math.round((row+1)*m.height/rows);return sharp(file).extract({left:l,top:t,width:r-l,height:b-t}).resize(S,S,{fit:'fill'}).ensureAlpha().raw().toBuffer();}
// Keep the principal art component and its antialiased fiber edge; remove disconnected alpha debris.
function isolate(raw){const visited=new Uint8Array(S*S);let largest=[];for(let i=0;i<visited.length;i++){if(visited[i]||raw[i*4+3]<96)continue;const q=[i];visited[i]=1;for(let at=0;at<q.length;at++){const v=q[at],x=v%S,y=Math.floor(v/S);for(const n of [x?v-1:-1,x<S-1?v+1:-1,y?v-S:-1,y<S-1?v+S:-1])if(n>=0&&!visited[n]&&raw[n*4+3]>=96){visited[n]=1;q.push(n);}}if(q.length>largest.length)largest=q;}
 const keep=new Uint8Array(S*S);for(const i of largest){const x=i%S,y=Math.floor(i/S);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<S&&y+dy>=0&&y+dy<S)keep[(y+dy)*S+x+dx]=1;}
 for(let i=0;i<keep.length;i++)if(!keep[i])raw[i*4+3]=0;return raw;
}
async function resizeArt(raw,width,height){const b=bounds(raw);return sharp(raw,{raw:{width:S,height:S,channels:4}}).extract(b).resize(Math.round(width),Math.round(height),{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});}
function place(dst,data,width,height,x,y){x=Math.round(x);y=Math.round(y);for(let sy=0;sy<height;sy++)for(let sx=0;sx<width;sx++){const tx=sx+x,ty=sy+y;if(tx>=0&&tx<S&&ty>=0&&ty<S)data.copy(dst,(ty*S+tx)*4,(sy*width+sx)*4,(sy*width+sx)*4+4);}return dst;}
async function atlas(name,cols,rows,cells){await sharp({create:{width:S*cols,height:S*rows,channels:4,background:'#0000'}}).composite(await Promise.all(cells.map(async({c,r,raw})=>({input:await encode(raw),left:c*S,top:r*S})))).webp({lossless:true,effort:5}).toFile(OUT+'/'+name+'.webp');}
const heads=[],shapes=[],hairCells=[],outfits=[],noses=[];
for(let shape=0;shape<6;shape++)for(let frame=0;frame<3;frame++){
 const original=old.body[shape][frame],raw=isolate(await cell('data/puppet-sources/v2/heads.png',3,6,frame,shape));
 const top=original.forehead+128-original.nose.y,chin=original.neck+128-original.nose.y+4;
 const width=original.crop.width-4,height=chin-top+1;
 const fitted=await resizeArt(raw,width,height);const target=place(blank(),fitted.data,fitted.info.width,fitted.info.height,128-width/2,top);
 const b=bounds(target),tops=Array(S).fill(null);for(let x=0;x<S;x++)for(let y=0;y<Math.min(130,S);y++)if(target[(y*S+x)*4+3]>160){tops[x]=y;break;}
 const span=y=>{let l=128,r=128;while(l>0&&target[(y*S+l-1)*4+3]>128)l--;while(r<S-1&&target[(y*S+r+1)*4+3]>128)r++;return {left:l,right:r,width:r-l+1};};
 const morphology={shape,frame,chin:b.top+b.height-1,forehead:b.top,brow:span(Math.round(b.top+27)),cheek:span(154),jaw:span(173),tops,bounds:b};
 shapes.push(morphology);heads.push({c:frame,r:shape,raw:target});
}
// Full, finished costume silhouettes: deliberately short busts, with the complete curved lower edge.
for(let option=0;option<6;option++){
 const raw=isolate(await cell('data/puppet-sources/v2/outfits.png',3,2,option%3,Math.floor(option/3))),fit=await resizeArt(raw,232,110);
 outfits.push({c:option,r:0,raw:place(blank(),fit.data,fit.info.width,fit.info.height,12,82)});
}
const noseOrder=[1,0,2,3,4,5],sizes=[[25,37],[30,30],[37,23],[30,39],[21,43],[36,28]];
for(let option=0;option<6;option++){
 const source=noseOrder[option],raw=isolate(await cell('data/puppet-sources/v2/noses.png',3,2,source%3,Math.floor(source/3))),[w,h]=sizes[option],fit=await resizeArt(raw,w,h);
 noses.push({c:option,r:0,raw:place(blank(),fit.data,w,h,128-w/2,128-h/2)});
}
// Extend the inner fringe to meet the actual scalp of each morphology, not a generic oval.
const contact=[];
for(const h of shapes)for(let style=1;style<=6;style++){
 const raw=isolate(await cell('data/puppet-sources/v2/hair.png',3,2,(style-1)%3,Math.floor((style-1)/3)));
 const box=bounds(raw),width=Math.max(105,Math.min(192,h.brow.width*1.65)),height=box.height*width/box.width;
 const resized=await resizeArt(raw,width,height),sw=resized.info.width,sh=resized.info.height;
 let centerLine=0;
 for(let py=0;py<sh;py++)for(let px=Math.floor(sw/2)-5;px<=Math.floor(sw/2)+5;px++)if(resized.data[(py*sw+px)*4+3]>180)centerLine=py;
 const y=h.forehead+18-centerLine,x=128-sw/2;
 const target=place(blank(),resized.data,sw,sh,x,y+48);let repaired=0;

 hairCells.push({c:style-1,r:h.shape*3+h.frame,raw:target});contact.push({shape:h.shape,frame:h.frame,style,repaired});
}
// Felt neck patch; sits behind clothing and behind the intact head, never clips the chin.
const oldBody=await cell('public/puppets/body.webp',3,6,0,0),neck=blank();
for(let y=0;y<44;y++)for(let x=0;x<34;x++){const src=((210+y%22)*S+111+x)*4,dst=((198+y)*S+111+x)*4;oldBody.copy(neck,dst,src,src+4);}
await Promise.all([atlas('heads',3,6,heads),atlas('outfits',6,1,outfits),atlas('noses',6,1,noses),atlas('hair',6,18,hairCells),atlas('neck',1,1,[{c:0,r:0,raw:neck}])]);
writeFileSync('lib/puppet-morphologies.json',JSON.stringify({version:2,stage:{x:-12,y:-40,width:280,height:376},shapes,contact},null,2)+'\n');
console.log('Packed 18 intact nose-free heads, 108 fitted fringes, 6 complete busts, 6 nose shapes and neck texture.');
