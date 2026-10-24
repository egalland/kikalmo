import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const runtime=uri("export const jsx=(type,props)=>({type,props});export const jsxs=jsx;export const Fragment='fragment';");
let source=ts.transpileModule(readFileSync('app/components/MobileMenu.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(runtime)).replace(/import \{[^}]+\} from 'react';/,"const useId=()=> 'mobile-nav',useRef=()=>globalThis.menuRef,useEffect=fn=>globalThis.menuEffects.push(fn);").replace(/import \{[^}]+\} from 'lucide-react';/,"const Menu='icon',X='icon';");
const {default:MobileMenu}=await import(uri(source));
const previousDocument=globalThis.document,previousWindow=globalThis.window;
const listeners={},cleanups=[];let focused=0,prevented=0;
try{
 const root={open:true,contains:n=>n==='inside',querySelector:()=>({focus:()=>focused++})};globalThis.menuRef={current:root};globalThis.menuEffects=[];
 globalThis.document={addEventListener:(key,fn)=>listeners[key]=fn,removeEventListener:key=>delete listeners[key]};globalThis.window={innerWidth:390,addEventListener:(key,fn)=>listeners[key]=fn,removeEventListener:key=>delete listeners[key]};
 const tree=MobileMenu({children:'navigation actions'});for(const effect of globalThis.menuEffects)cleanups.push(effect());assert.equal(tree.type,'details');const [summary,nav]=tree.props.children;assert.equal(summary.type,'summary');assert.equal(summary.props['aria-controls'],nav.props.id);assert.equal(nav.props['aria-label'],'Navigation principale');
 listeners.pointerdown({target:'inside'});assert.equal(root.open,true);listeners.pointerdown({target:'outside'});assert.equal(root.open,false,'Outside pointer closes the dropdown');
 root.open=true;tree.props.onKeyDown({key:'Escape',preventDefault:()=>prevented++});assert.equal(root.open,false);assert.equal(focused,1,'Escape returns focus to the menu summary');assert.equal(prevented,1);
 root.open=true;nav.props.onClick({target:{closest:()=>null}});assert.equal(root.open,true);nav.props.onClick({target:{closest:()=>({})}});assert.equal(root.open,false,'Selecting any link or action closes navigation');
 root.open=true;window.innerWidth=1000;listeners.resize();assert.equal(root.open,false,'Resizing to desktop clears stale mobile navigation');
 for(const cleanup of cleanups)cleanup();assert.deepEqual(Object.keys(listeners),[]);
 console.log('Passed mobile menu: native accessible disclosure, outside close, Escape/focus return, action close, desktop resize and listener cleanup.');
}finally{globalThis.document=previousDocument;globalThis.window=previousWindow;delete globalThis.menuRef;delete globalThis.menuEffects;}
