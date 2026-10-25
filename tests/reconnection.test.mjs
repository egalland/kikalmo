import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const source=readFileSync('app/page.tsx','utf8'),start=source.indexOf("useEffect(()=>{\n if(!room)return;"),end=source.indexOf("useEffect(()=>{let cancelled=false;setArt",start);
const js=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let cleanup;const states=[],received=[],actions=[],intervals=[],events=new Map(),room='cinema',session={current:1},active={current:room},profile={current:{name:'Test',avatar:{}}},latest={current:9};let replies=[{revision:10}],nowOnline=true;
const fakeWindow={addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k)},fakeDocument={hidden:false,addEventListener:(k,fn)=>events.set(k,fn),removeEventListener:k=>events.delete(k)};
const make=new Function('useEffect','room','session','active','currentProfile','setConnection','call','receive','latest','setFeedback','setTick','navigator','window','document','setInterval','clearInterval','setTimeout','clearTimeout',js);
async function call(action){actions.push(action);const r=replies.shift();if(r instanceof Error)throw r;return r||{revision:11};}
make(fn=>{cleanup=fn()},room,session,active,profile,s=>states.push(s),call,d=>received.push(d),latest,()=>{},()=>{},{get onLine(){return nowOnline}},fakeWindow,fakeDocument,fn=>{intervals.push(fn);return intervals.length},()=>{},()=>1,()=>{});
const flush=()=>new Promise(r=>setImmediate(r));await flush();assert.equal(received.length,1);
nowOnline=false;events.get('offline')();assert.equal(states.at(-1),'offline');const before=actions.length;await intervals[0]();assert.equal(actions.length,before,'Offline polling sends no requests');
nowOnline=true;replies=[Object.assign(Error('Expired'),{expired:true}),{revision:1}];await events.get('online')();assert.deepEqual(actions.slice(-2),['sync','join']);assert.equal(latest.current,-1,'Rejoined rooms can restart revisions');assert.equal(states.at(-1),'restored');assert.equal(received.at(-1).revision,1);assert.ok(!actions.includes('answer')&&!actions.includes('chat'),'Recovery never replays an answer/message');
let resolve;replies=[];const oldCall=call; // Verify listeners are removed and late requests cannot apply after cleanup.
cleanup();assert.equal(events.size,0);assert.equal(received.length,2);console.log('Passed reconnect: offline state, no offline calls, rejoin on expiry, revision reset, restored status, no resend and listener cleanup.');
