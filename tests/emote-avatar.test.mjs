import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Avatar} from '../scripts/puppet-render.mjs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const emotes=uri(compile(readFileSync('lib/emotes.ts','utf8')));
let source=compile(readFileSync('app/components/AvatarEmote.tsx','utf8'));
source=source.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("import Avatar from './Avatar';",`import {Avatar} from ${JSON.stringify(new URL('../scripts/puppet-render.mjs',import.meta.url).href)};`).replace("'../../lib/emotes'",JSON.stringify(emotes));
const {default:AvatarEmote}=await import(uri(source));const {EMOTE_DETAILS,liveReaction}=await import(emotes);
const avatars=[{shape:0,hair:2,eyes:0,mouth:0,accessory:0,outfit:0,color:'#f8d779'},{shape:2,hair:5,eyes:2,mouth:3,accessory:1,outfit:2,color:'#c8b9ff'},{shape:5,hair:1,eyes:1,mouth:1,accessory:6,outfit:5,color:'#8fe1dd'}];
let checked=0;
for(const avatar of avatars)for(const emoji of Object.keys(EMOTE_DETAILS)){
 const direct=renderToStaticMarkup(createElement(Avatar,{value:avatar,emotion:emoji,animated:false}));
 const reaction=renderToStaticMarkup(createElement(AvatarEmote,{avatar,emoji,name:'Camille'}));
 const preview=renderToStaticMarkup(createElement(AvatarEmote,{avatar,emoji,preview:true}));
 // Ignore only the useId-based SVG clip IDs, which change per render.
 const canonical=s=>s.replace(/nose-[a-zA-Z0-9_-]+/g,'nose-ID');
 assert.ok(canonical(reaction).includes(canonical(direct)),'Reaction must use the complete sender avatar, including shape, tint, parts and emote pose');
 assert.ok(canonical(preview).includes(canonical(direct)),'Picker previews the exact same identity/expression');
 assert.match(reaction,/role="status"/);assert.ok(reaction.includes('Camille : '+EMOTE_DETAILS[emoji].label));assert.doesNotMatch(preview,/role="status"/);checked++;
}
const reaction={at:1000,text:'😂'};assert.equal(liveReaction(reaction,5499),reaction);assert.equal(liveReaction(reaction,5500),undefined);assert.equal(liveReaction(undefined,0),undefined);
const page=readFileSync('app/page.tsx','utf8');assert.match(page,/avatar=\{p.avatar\} emoji=\{p.reaction.text\}/,'Received reactions must use the sender, not the local profile');
console.log(`Passed: ${checked} personalized reactions and picker previews, full avatar identity preserved, sender binding, accessible labels and local expiry.`);
