import ts from 'typescript';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const js=ts.transpileModule(readFileSync('lib/emote-sound.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {EMOTE_OPTIONS,EMOTE_AUDIO,messageTime,playEmoteSound,preloadEmoteSounds}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(EMOTE_OPTIONS.length,10);assert.match(messageTime(1000),/^\d{2}:\d{2}:01$/);assert.equal(messageTime(),'--:--:--');
const approved=JSON.parse(readFileSync('data/slapstick-audio.json','utf8'));
const hashes=[];
for(const emoji of EMOTE_OPTIONS){
 const wav=readFileSync('public/audio/slapstick-v1/'+EMOTE_AUDIO[emoji]+'.wav');
 assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(24),44100);assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt16LE(34),16);
 const pcm=wav.subarray(44);assert.equal(pcm.length/2/44100,.85);
 let peak=0,energy=0;for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v;}
 assert.ok(peak>.45&&peak<.5);assert.ok(Math.sqrt(energy/(pcm.length/2))>.03);const hash=createHash('sha256').update(pcm).digest('hex');assert.equal(hash,approved.pcmSha256[EMOTE_AUDIO[emoji]],'PCM must match the approved audition');hashes.push(hash);
}
assert.equal(new Set(hashes).size,10,'Distinct approved effects');
const sources=[],gains=[],requests=[];let decoded=0,fail=false;
globalThis.fetch=async path=>{requests.push(path);return {ok:!fail,arrayBuffer:async()=>new ArrayBuffer(16)}};
const ac={currentTime:0,state:'running',destination:{},decodeAudioData:async()=>{decoded++;return {}},createGain(){const n={gain:{value:0},connect(){},disconnect(){this.closed=true}};gains.push(n);return n},createBufferSource(){const n={connect(){},disconnect(){this.closed=true},start(){this.started=true},stop(){this.stopped=true;this.onended?.()}};sources.push(n);return n}};
await Promise.all(Array.from({length:5},()=>playEmoteSound(ac,'😂')));assert.equal(requests.length,1);assert.equal(decoded,1);assert.equal(sources.filter(s=>s.stopped).length,2);
for(const source of sources)source.onended();assert.ok(sources.every(s=>s.closed));assert.ok(gains.every(s=>s.closed));
await playEmoteSound(ac,'unknown');assert.equal(sources.length,5);await playEmoteSound(ac,'😂',()=>false);assert.equal(sources.length,5,'Muting while loading suppresses playback');
fail=true;await assert.rejects(()=>playEmoteSound(ac,'🦆'));fail=false;await playEmoteSound(ac,'🦆');assert.equal(sources.length,6,'Network errors can be retried');
preloadEmoteSounds(ac);await new Promise(r=>setTimeout(r,0));assert.equal(new Set(requests).size,10,'All effects preloaded');
console.log('Passed: ten real WAV effects, distinct PCM/levels, asynchronous cache, preload, overlap cap, mute guard, retry and cleanup.');
