import ts from 'typescript';import {readFileSync} from 'node:fs';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import assert from 'node:assert/strict';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
async function component(path){let source=readFileSync(path,'utf8').replace("import Avatar from './Avatar';",'const Avatar=()=>null;').replace("'../../lib/message-notifications.mjs'",JSON.stringify(new URL('../lib/message-notifications.mjs',import.meta.url).href));source=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("'react'",JSON.stringify(import.meta.resolve('react'))).replace("'lucide-react'",JSON.stringify(import.meta.resolve('lucide-react')));return(await import(uri(source))).default;}
const FriendButton=await component('app/components/RoomFriendButton.tsx'),Messenger=await component('app/components/PrivateMessenger.tsx');
const person={id:'1234abcd',name:'Alice'},friend={playerKey:person.id,code:'AAAAAAAAAAAAAAAA',name:'Alice',online:false,hidden:false,room:null,avatar:{}};
const empty={me:{code:'BBBBBBBBBBBBBBBB',visible:true},friends:[],outgoing:[],incoming:[],blocked:[]},controller={data:empty,ready:true,busy:false,error:'',action:async()=>{},refresh:async()=>{}};
const render=(data,ready=true)=>renderToStaticMarkup(createElement(FriendButton,{player:person,room:'cinema',controller:{...controller,data,ready},onFriends:()=>{},onChat:()=>{}}));
assert.ok(render(empty).includes('Ajouter Alice en ami'));assert.ok(render(empty).includes('Bloquer Alice'));
let html=render({...empty,friends:[friend]});assert.ok(!html.includes('Ajouter Alice'));assert.ok(html.includes('Message privé'));assert.ok(html.includes('Bloquer Alice'));
html=render({...empty,outgoing:[friend]});assert.ok(!html.includes('Ajouter Alice'));assert.ok(html.includes('Demande envoyée'));
html=render({...empty,blocked:[friend]});assert.ok(!html.includes('Ajouter Alice'));assert.ok(html.includes('Débloquer'));
assert.equal(render(empty,false),'','Do not flash Add while friendship state is loading');
const props={controller:{...controller,data:{...empty,friends:[friend]}},profile:{name:'Bob',avatar:{}},open:true,onOpen:()=>{},selectedCode:'',onSelect:()=>{},onFriends:()=>{},onProfile:()=>{}};
html=renderToStaticMarkup(createElement(Messenger,props));assert.ok(html.includes('Messages privés'));assert.ok(html.includes('Bloqués (0)'));assert.ok(html.includes('Alice'));assert.ok(!html.includes('Trouvez le mot'));
html=renderToStaticMarkup(createElement(Messenger,{...props,selectedCode:friend.code}));assert.ok(html.includes('Message privé à Alice'));assert.ok(html.includes('Bloquer cette personne'));assert.ok(/maxlength="1000"/i.test(html));assert.ok(!html.includes('Fil du salon'));
console.log('Passed messenger UI: accepted friends never show Add, pending/blocked actions, no loading flash, private contacts, block controls and separate message composer.');
