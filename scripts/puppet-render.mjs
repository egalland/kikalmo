import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import sharp from 'sharp';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const profile=uri(compile(readFileSync('lib/profile.ts','utf8')));
const puppet=uri(compile(readFileSync('lib/puppet.ts','utf8')));
const geometry=uri(compile(readFileSync('lib/puppet-registration.ts','utf8').replace("import registration from './puppet-registration.json';",'const registration='+readFileSync('lib/puppet-registration.json','utf8')+';')));
const morph=uri(compile(readFileSync('lib/puppet-morphology.ts','utf8').replace("import morphologies from './puppet-morphologies.json';",'const morphologies='+readFileSync('lib/puppet-morphologies.json','utf8')+';')));
const cosmetics=uri(compile(readFileSync('lib/cosmetics.ts','utf8')));
const cosmeticArt=uri(compile(readFileSync('app/components/CosmeticArt.tsx','utf8')).replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("'../../lib/cosmetics'",JSON.stringify(cosmetics)).replace("'../../lib/puppet-morphology'",JSON.stringify(morph)));
let source=compile(readFileSync('app/components/Avatar.tsx','utf8')).replace("'./CosmeticArt'",JSON.stringify(cosmeticArt));
source=source.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("'react'",JSON.stringify(import.meta.resolve('react'))).replace("'../../lib/profile'",JSON.stringify(profile)).replace("'../../lib/puppet'",JSON.stringify(puppet)).replace("'../../lib/puppet-registration'",JSON.stringify(geometry)).replace("'../../lib/puppet-morphology'",JSON.stringify(morph));
const {PuppetArt,default:Avatar}=await import(uri(source));
export {Avatar};
export const {puppetPose}=await import(puppet);
const assets={};for(const name of ['body','eyes','mouth','parts'])assets[name]=(await sharp('public/puppets/'+name+'.webp').png().toBuffer()).toString('base64');
const v2={};for(const name of ['heads','outfits','noses','neck','hair','tuft'])v2[name]=(await sharp('public/puppets/v2/'+name+'.webp').png().toBuffer()).toString('base64');
export function renderPuppet(value,frame,id='qa',expression='idle',size=256){
 let svg=renderToStaticMarkup(createElement(PuppetArt,{value,frame,id,expression,label:'Avatar de contrôle'}));
 return svg.replaceAll(/href="\/puppets\/v2\/([a-z]+)\.webp"/g,(_,name)=>'href="data:image/png;base64,'+v2[name]+'"').replace('width="256" height="256"',`width="${size}" height="${size}"`).replaceAll(/href="\/puppets\/([a-z]+)\.webp\?v=\d+"/g,(_,name)=>'href="data:image/png;base64,'+assets[name]+'"');
}
