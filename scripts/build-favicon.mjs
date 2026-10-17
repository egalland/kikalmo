import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
import {renderPuppet} from './puppet-render.mjs';

// The favicon uses the same assembled felt character as the avatar editor.
const puppet=renderPuppet({shape:0,hair:3,eyes:0,nose:2,mouth:0,accessory:0,outfit:5,color:'#f8d779'},{body:0,eyes:0,mouth:0,eyesRow:0,mouthRow:0},'favicon','idle',256)
 .replace('viewBox="-12 -40 280 376"','viewBox="0 -35 256 256"');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs><clipPath id="icon-edge"><rect width="256" height="256" rx="56"/></clipPath></defs><g clip-path="url(#icon-edge)"><rect width="256" height="256" fill="#30483b"/>${puppet}</g></svg>`;
const png=await sharp(Buffer.from(svg)).resize(128,128).png().toBuffer();
await writeFile('public/favicon.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`);
await sharp(Buffer.from(svg)).resize(32,32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(svg)).resize(180,180).png().toFile('public/apple-touch-icon.png');
const sizes=[16,32,48],images=await Promise.all(sizes.map(size=>sharp(Buffer.from(svg)).resize(size,size).png().toBuffer()));
const header=Buffer.alloc(6+sizes.length*16);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
sizes.forEach((size,i)=>{const at=6+i*16;header[at]=size;header[at+1]=size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;});
await writeFile('public/favicon.ico',Buffer.concat([header,...images]));
