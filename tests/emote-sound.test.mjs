import ts from 'typescript';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const js=ts.transpileModule(readFileSync('lib/emote-sound.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {EMOTE_OPTIONS,messageTime,playEmoteSound,renderEmoteSamples}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(EMOTE_OPTIONS.length,10);assert.match(messageTime(1000),/^\d{2}:\d{2}:01$/);assert.equal(messageTime(),'--:--:--');
for(const rate of [8000,44100,48000]){
 const hashes=[];
 for(const emoji of EMOTE_OPTIONS){
  const pcm=renderEmoteSamples(emoji,rate);assert.ok(pcm.length>rate*.3&&pcm.length<rate*.9);
  let peak=0,energy=0,sum=0,jump=0;for(let i=0;i<pcm.length;i++){const s=pcm[i];assert.ok(Number.isFinite(s));peak=Math.max(peak,Math.abs(s));energy+=s*s;sum+=s;if(i)jump=Math.max(jump,Math.abs(s-pcm[i-1]));}
  assert.ok(peak>.35&&peak<.5,`${emoji}: normalized headroom`);assert.ok(Math.sqrt(energy/pcm.length)>.025,`${emoji}: audible energy`);assert.ok(Math.abs(sum/pcm.length)<.01,`${emoji}: no DC bias`);
  assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
  assert.deepEqual(pcm,renderEmoteSamples(emoji,rate),'The tested signal is deterministic');hashes.push(createHash('sha256').update(pcm).digest('hex'));
 }
 assert.equal(new Set(hashes).size,10);
}
assert.equal(renderEmoteSamples('__proto__',44100),null);
let buffers=0;const sources=[],gains=[];
const ac={currentTime:0,sampleRate:44100,destination:{},createGain(){const n={gain:{value:0},connect(){},disconnect(){this.closed=true}};gains.push(n);return n},createBufferSource(){const n={connect(){},disconnect(){this.closed=true},start(){this.started=true},stop(){this.stopped=true;this.onended?.()}};sources.push(n);return n},createBuffer(channels,length){buffers++;const pcm=new Float32Array(length);return {getChannelData:()=>pcm}}};
for(let i=0;i<5;i++)playEmoteSound(ac,'😂');assert.equal(buffers,1,'Decoded PCM cached per context/emote');assert.equal(sources.filter(s=>s.stopped).length,2,'At most three overlapping reactions');
for(const source of sources)source.onended();assert.ok(sources.every(s=>s.closed));assert.ok(gains.every(s=>s.closed));playEmoteSound(ac,'unknown');assert.equal(sources.length,5);
console.log('Passed: 30 deterministic PCM signals, distinct sounds, silent boundaries, peak/energy/DC checks, cache, overlap limit and audio cleanup.');
