import {renderPuppet,puppetPose} from './puppet-render.mjs';
import sharp from 'sharp';
const tiles=[];
for(let id=1;id<=24;id++){
 const avatar={shape:(id-1)%6,hair:1,eyes:0,nose:1,mouth:0,accessory:0,outfit:(id-1)%6,color:'#f8d779',cosmetic:id};
 const svg=renderPuppet(avatar,puppetPose(0,0,'idle',0,0,false),'accessory-'+id,'idle',224);
 tiles.push({input:await sharp(Buffer.from(svg)).png().toBuffer(),left:((id-1)%6)*224,top:Math.floor((id-1)/6)*224});
}
await sharp({create:{width:1344,height:896,channels:4,background:'#f8f0dd'}}).composite(tiles).png().toFile(process.argv[2]||'/tmp/kikalmo-accessory-review.png');
