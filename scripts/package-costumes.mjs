import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const inputs=JSON.parse(readFileSync(process.argv[2],'utf8'));
mkdirSync('public/puppets/costumes',{recursive:true});
const output=[];
for(const input of inputs){
 const raw=readFileSync(input.path);
 const webp=await sharp(raw).resize({width:1024,height:1024,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100,effort:6}).toBuffer();
 const {data,info}=await sharp(webp).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h,channels}=info,alpha=i=>data[i*channels+3];
 const seed=Math.floor(h*.4)*w+Math.floor(w*.5);if(alpha(seed)>16)throw Error(input.key+': face seed is opaque');
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=1;queue[0]=seed;seen[seed]=1;
 let x0=w,y0=h,x1=0,y1=0;
 while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
 for(const n of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(n>=0&&!seen[n]&&alpha(n)<16){seen[n]=1;queue[tail++]=n;}}
 if(x0===0||y0===0||x1===w-1||y1===h-1||tail<5000)throw Error(input.key+': face aperture is not enclosed');
 const face={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1,pixels:tail};
 let bx0=w,by0=h,bx1=0,by1=0;
 for(let i=0;i<w*h;i++)if(alpha(i)>128){const x=i%w,y=Math.floor(i/w);bx0=Math.min(bx0,x);by0=Math.min(by0,y);bx1=Math.max(bx1,x);by1=Math.max(by1,y);}
 const bounds={x:bx0,y:by0,width:bx1-bx0+1,height:by1-by0+1};
 const scale=Math.min(460/bounds.height,400/bounds.width),x=128-(face.x+face.width/2)*scale,y=122-(face.y+face.height/2)*scale;
 const stage={x:Math.floor(x+bounds.x*scale)-8,y:Math.floor(y+bounds.y*scale)-8,width:Math.ceil(bounds.width*scale)+16,height:Math.ceil(bounds.height*scale)+16};
 const url='/puppets/costumes/'+input.key+'.webp';writeFileSync('public'+url,webp);
 output.push({id:input.id,key:input.key,url,width:w,height:h,face,bounds,stage,sourceSha256:createHash('sha256').update(raw).digest('hex')});
 console.log(input.key+': '+webp.length+' bytes, alpha face '+face.width+'×'+face.height+', stage '+JSON.stringify(stage));
}
// Shared viewport keeps costumes consistent in the shop and remote-player cards.
const left=Math.min(...output.map(a=>a.stage.x)),top=Math.min(...output.map(a=>a.stage.y));
const right=Math.max(...output.map(a=>a.stage.x+a.stage.width)),bottom=Math.max(...output.map(a=>a.stage.y+a.stage.height));
for(const asset of output)asset.stage={x:left,y:top,width:right-left,height:bottom-top};
writeFileSync('lib/costume-assets.json',JSON.stringify(output,null,2)+'\n');
