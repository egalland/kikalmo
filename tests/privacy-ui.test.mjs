import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const runtime=uri("export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment='fragment';");
let source=ts.transpileModule(readFileSync('app/components/PrivacyControls.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
source=source.replaceAll('"react/jsx-runtime"',JSON.stringify(runtime)).replace("import { useEffect, useRef, useState } from 'react';","const useEffect=(...a)=>globalThis.privacyHooks.effect(...a),useRef=(...a)=>globalThis.privacyHooks.ref(...a),useState=(...a)=>globalThis.privacyHooks.state(...a);");
const {default:Controls}=await import(uri(source));
const flatten=n=>Array.isArray(n)?n.flatMap(flatten):n&&typeof n==='object'?[n,...flatten(n.props?.children)]:[];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):String(n??'');
const originalFetch=globalThis.fetch;
function fixture(){
 const values=[],deps=[],effects=[];let cursor=0,tree,dialog=null,resolveGet,postOK=true;
 const initial=new Promise(r=>resolveGet=r);
 globalThis.fetch=async(path,opts)=>path==='/api/privacy'&&opts?.method==='POST'?Response.json({}, {status:postOK?200:503}):initial;
 const hooks={state(initial){const i=cursor++;if(!(i in values))values[i]=initial;return [values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v;}];},ref(initial){const i=cursor++;if(!(i in values))values[i]={current:initial};return values[i];},effect(fn,next){const i=cursor++;if(!deps[i]||next.some((v,k)=>!Object.is(v,deps[i][k]))){deps[i]=next;effects.push(fn);}}};
 function render(){globalThis.privacyHooks=hooks;cursor=0;tree=Controls();const d=flatten(tree).find(n=>n.type==='dialog');if(d){dialog??={open:false,showModal(){this.open=true;}};d.props.ref.current=dialog;}else{for(const v of values)if(v&&v.current===dialog)v.current=null;dialog=null;}for(const effect of effects.splice(0))effect();return flatten(tree);}
 const find=(predicate)=>flatten(tree).find(predicate),button=label=>find(n=>n.type==='button'&&text(n)===label);
 return {render,button,find,get dialog(){return dialog;},resolve:async(choice)=>{resolveGet(Response.json({choice}));for(let i=0;i<8;i++)await Promise.resolve();},failSave(){postOK=false;}};
}
try{
 let f=fixture();assert.equal(f.render().some(n=>n.type==='dialog'),false,'Closed settings must not render a dialog during hydration');await f.resolve(null);assert.ok(f.render().some(n=>n.props.className==='privacy-banner'));
 f.button('Confidentialité et cookies').props.onClick();f.render();assert.equal(f.dialog.open,true);const onClose=f.find(n=>n.type==='dialog').props.onClose;
 onClose();f.render();assert.equal(f.dialog.open,true,'A queued close event must not dismiss a currently open dialog');
 f.render();assert.equal(f.dialog.open,true,'Unrelated rerenders must keep settings open');
 f.failSave();await f.button('Accepter les statistiques').props.onClick();f.render();assert.equal(f.dialog.open,true,'A failed save must keep the choice visible');assert.ok(f.find(n=>n.props.role==='alert'));
 f=fixture();f.render();f.button('Confidentialité et cookies').props.onClick();f.render();await f.button('Refuser / retirer mon accord').props.onClick();f.render();assert.equal(f.dialog,null);await f.resolve(null);assert.ok(!f.render().some(n=>n.props.className==='privacy-banner'),'A late initial response must not overwrite an explicit saved choice');
 f=fixture();f.render();await f.resolve(null);f.render();f.button('Confidentialité et cookies').props.onClick();f.render();f.button('×').props.onClick();assert.ok(f.render().some(n=>n.props.className==='privacy-banner'),'Closing settings without choosing must restore the consent banner');
 console.log('Passed privacy UI: hydration, stable open dialog, stale native close, rerenders, failed save, late response, explicit close.');
}finally{globalThis.fetch=originalFetch;delete globalThis.privacyHooks;}
