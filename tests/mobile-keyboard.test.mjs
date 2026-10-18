import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LETTER_ROWS,NUMBER_ROWS,keyboardEdit} from '../lib/mobile-keyboard.mjs';
import {answerFeedback} from '../lib/answer-feedback.mjs';
assert.equal(new Set(LETTER_ROWS.join('')).size,26);assert.equal(LETTER_ROWS.join('').length,26);
for(const digit of '0123456789')assert.ok(NUMBER_ROWS.join('').includes(digit));
let text='';for(const key of 'band of brothers')text=keyboardEdit(text,key).value;
assert.equal(text,'band of brothers');
assert.deepEqual(keyboardEdit('band of bro','thers'),{value:'band of brothers',cursor:16});
assert.deepEqual(keyboardEdit('wrong','b',0,5),{value:'b',cursor:1},'Typing after a selected wrong guess replaces it');
assert.deepEqual(keyboardEdit('band of bro','BACKSPACE',4,4),{value:'ban of bro',cursor:3});
assert.deepEqual(keyboardEdit('a😀','BACKSPACE'),{value:'a',cursor:1},'Backspace removes the whole code point');
assert.equal(keyboardEdit('ab','DELETE',0,0).value,'b');
assert.equal(keyboardEdit('ab','SPACE',1,1).value,'a b');
assert.equal(keyboardEdit('a'.repeat(200),'b').value.length,200);
assert.equal(keyboardEdit('a'.repeat(200),'bbb',0,3).value.length,200);
assert.equal(keyboardEdit('','BACKSPACE').value,'');
for(const [result,title] of [['incorrect','Incorrect'],['close','Tu es proche !'],['correct','Premier à trouver !']]){
 const f=answerFeedback(result,{answer:'band of bro',gain:347,rank:1});assert.equal(f.title,title);assert.equal(f.kind,result);
 if(result!=='correct')assert.ok(f.text.includes('band of bro'),'Feedback identifies the actual submitted answer');
}
assert.ok(answerFeedback('correct',{gain:347}).text.includes('347'));
assert.equal(answerFeedback('correct',{daily:true}).title,'Mot trouvé !');
assert.equal(answerFeedback('sent').title,'Message envoyé');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
let keyboardSource=compile(readFileSync('app/components/MobileKeyboard.tsx','utf8'));
keyboardSource=keyboardSource.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("'react'",JSON.stringify(import.meta.resolve('react'))).replace("'../../lib/mobile-keyboard.mjs'",JSON.stringify(new URL('../lib/mobile-keyboard.mjs',import.meta.url).href));
const {default:Keyboard}=await import(uri(keyboardSource));
const props={mobile:true,custom:true,value:'band',onChange(){},onSubmit(){},onNative(){},input:{current:null}};
const html=renderToStaticMarkup(createElement(Keyboard,props));
for(const label of ['Clavier Kikalmo','Clavier téléphone','Espace','Valider','Effacer le caractère précédent'])assert.ok(html.includes(label));
assert.equal((html.match(/type="button"/g)||[]).length,31,'26 letters, backspace, three bottom keys and native switch');
const native=renderToStaticMarkup(createElement(Keyboard,{...props,custom:false}));assert.ok(native.includes('Utiliser le clavier Kikalmo'));assert.ok(!native.includes('keyboard-keys'));
assert.equal(renderToStaticMarkup(createElement(Keyboard,{...props,mobile:false})),'');
let feedbackSource=compile(readFileSync('app/components/GuessFeedback.tsx','utf8')).replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')));
const {default:Feedback}=await import(uri(feedbackSource));
const card=renderToStaticMarkup(createElement(Feedback,{feedback:answerFeedback('incorrect',{answer:'band of bro'})}));
assert.ok(card.includes('role="status"'));assert.ok(card.includes('aria-atomic="true"'));assert.ok(card.includes('Incorrect'));assert.ok(card.includes('band of bro'));
console.log('Passed: AZERTY and digits, cursor edits, selected retries, erase/space/limits, explicit verdicts, accessible feedback, rendered keyboard and native fallback.');

// Exercise the real room submit handler: polling must not erase verdicts or replay old ones.
const home=readFileSync('app/page.tsx','utf8');
const handler=home.slice(home.indexOf('async function converse('),home.indexOf('async function leave('));
const names=['answerFeedback','answer','snapshot','sendLock','setSending','lastMessage','setVerdict','setError','input','session','call','room','receive','setAnswer','setFeedback','setBurst'];
const make=new Function('ctx',compile('const {'+names.join(',')+'}=ctx;'+handler+';return converse;'));
const previousRAF=globalThis.requestAnimationFrame;globalThis.requestAnimationFrame=fn=>{fn();return 1;};
function fixture(){
 let resolve,requests=0;const verdicts=[],edits=[];
 const ctx={answerFeedback,answer:'band of bro',snapshot:{current:{game:'test',round:1,phase:'guess',players:[]}},sendLock:{current:false},setSending(){},lastMessage:{current:''},setVerdict:v=>verdicts.push(v),setError(){},input:{current:{focus(){},setSelectionRange(){}}},session:{current:1},call:()=>{requests++;return new Promise(r=>resolve=r);},room:'series',receive:d=>{ctx.snapshot.current=d},setAnswer:s=>edits.push(s),setFeedback(){},setBurst(){}};
 return {ctx,verdicts,edits,submit:make(ctx),reply:()=>resolve({game:'test',round:1,phase:'guess',players:[],result:'incorrect'}),requests:()=>requests};
}
const f=fixture(),first=f.submit(),second=f.submit();assert.equal(f.requests(),1,'Double validation must send one request');f.reply();await Promise.all([first,second]);
assert.equal(f.verdicts.at(-1).kind,'incorrect');assert.equal(f.edits.at(-1),'band of bro');assert.equal(f.ctx.sendLock.current,false);
const old=fixture(),pending=old.submit();old.ctx.snapshot.current={game:'test',round:2,phase:'guess',players:[]};old.verdicts.length=0;old.reply();await pending;assert.equal(old.verdicts.length,0,'A late result must not overwrite the next round');
globalThis.requestAnimationFrame=previousRAF;
console.log('Passed: actual submit handler double-tap lock, incorrect verdict, selected retry and stale-round protection.');
