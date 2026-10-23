import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const inputs=JSON.parse(readFileSync(process.argv[2],'utf8')),output=[];
mkdirSync('public/puppets/accessories-v2',{recursive:true});
for(const input of inputs){
 const raw=readFileSync(input.path),{data,info}=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let i=0;i<info.width*info.height;i++)if(data[i*4+3]>32){const x=i%info.width,y=Math.floor(i/info.width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const left=Math.max(0,x0-8),top=Math.max(0,y0-8),width=Math.min(info.width,x1+9)-left,height=Math.min(info.height,y1+9)-top;
 const webp=await sharp(raw).extract({left,top,width,height}).resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100,effort:6}).toBuffer();
 const m=await sharp(webp).metadata(),url='/puppets/accessories-v2/'+input.key+'.webp';writeFileSync('public'+url,webp);
 output.push({key:input.key,url,width:m.width,height:m.height,sourceSha256:createHash('sha256').update(raw).digest('hex')});console.log(input.key+': '+m.width+'×'+m.height+', '+webp.length+' bytes');
}
writeFileSync('lib/accessory-assets.json',JSON.stringify(output,null,2)+'\n');
