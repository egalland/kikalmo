import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const runtime=uri("export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment='fragment';");
const profile=uri(compile(readFileSync('lib/profile.ts','utf8'))),cosmetics=uri(compile(readFileSync('lib/cosmetics.ts','utf8')));
let source=compile(readFileSync('app/components/CosmeticShop.tsx','utf8')).replaceAll('"react/jsx-runtime"',JSON.stringify(runtime)).replace(/import \{[^}]+\} from 'react';/,"const useState=(...a)=>globalThis.wardrobeHooks.state(...a),useRef=(...a)=>globalThis.wardrobeHooks.ref(...a),useEffect=(...a)=>globalThis.wardrobeHooks.effect(...a);").replace("'../../lib/profile'",JSON.stringify(profile)).replace("'../../lib/cosmetics'",JSON.stringify(cosmetics)).replace("import Avatar from './Avatar';","const Avatar='avatar';").replace(/import \{[^}]+\} from 'lucide-react';/,"const ArrowLeft='icon',ArrowRight='icon',Clock3='icon',Scissors='icon',Sparkles='icon';");
const {default:Shop}=await import(uri(source));
const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):String(n??'');
const {DEFAULT_AVATAR}=await import(profile),avatar={...DEFAULT_AVATAR,headwear:1,adornment:15,costume:26};const original=JSON.stringify(avatar),values=[],deps=[];let cursor,tree,props,requests=[],returned=0;
const oldFetch=globalThis.fetch,oldNow=Date.now;Date.now=()=>Date.parse('2026-10-23T20:00:00Z');
try{
 props={avatar,wallet:{room:500,daily:200,owned:[]},onWallet:w=>props.wallet=w,onCharacter:()=>returned++,focusId:34};
 globalThis.wardrobeHooks={state(init){const i=cursor++;if(!(i in values))values[i]=init;return[values[i],v=>values[i]=typeof v==='function'?v(values[i]):v];},ref(init){const i=cursor++;return values[i]??=( {current:init});},effect(fn,next){const i=cursor++;if(!deps[i]||next.some((v,k)=>v!==deps[i][k])){deps[i]=next;fn();}}};
 const render=()=>{cursor=0;tree=Shop(props);return flatten(tree);};const button=label=>flatten(tree).find(n=>n.type==='button'&&text(n)===label);
 render();render();assert.ok(flatten(tree).some(n=>n.type==='h4'&&text(n)==='Tresses violettes'),'Locked item opens its specific shop category and feature');
 globalThis.fetch=async(path,opts)=>{requests.push([path,JSON.parse(opts.body)]);return Response.json({room:465,daily:200,owned:[34]});};
 await button('Acheter').props.onClick();await new Promise(r=>setImmediate(r));render();assert.deepEqual(requests,[['/api/economy',{item:34}]]);assert.ok(props.wallet.owned.includes(34));assert.equal(JSON.stringify(avatar),original,'Buying and previews must never equip or erase any original slot');assert.ok(!button('Acheter'),'Owned item cannot be purchased again');
 flatten(tree).find(n=>n.type==='button'&&text(n).includes('Retour à Mon personnage')).props.onClick();assert.equal(returned,1);
 button('Costumes prestige').props.onClick();render();const examine=flatten(tree).find(n=>n.props?.['aria-label']==='Examiner Cosmonaute rétro');assert.ok(examine);examine.props.onClick();render();assert.equal(JSON.stringify(avatar),original);
 props.focusId=39;render();render();assert.ok(text(tree).includes('Encore 18 jours'));assert.ok(text(tree).includes('Citrouille des veillées'));assert.equal(JSON.stringify(avatar),original);
 Date.now=()=>Date.parse('2026-11-10T00:00:00+01:00');values.length=0;deps.length=0;props.focusId=undefined;render();render();assert.ok(text(tree).includes('Collection terminée'));assert.ok(!flatten(tree).some(n=>n.props?.['aria-label']==='Examiner Citrouille des veillées'));
 console.log('Passed shop UI: locked-item deep link, purchase-only request, wallet unlock, no automatic equip, independent preview and return to character.');
}finally{globalThis.fetch=oldFetch;Date.now=oldNow;delete globalThis.wardrobeHooks;}
