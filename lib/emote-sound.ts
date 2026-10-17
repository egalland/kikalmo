/** The exact original slapstick effects approved in the audio audition. */
export const EMOTE_OPTIONS=['👏','😂','🤔','🔥','🎉','❤️','👍','👎','🦆','🐶'] as const;
export const EMOTE_AUDIO:Record<string,string>={'👏':'applaudissements','😂':'rire','🤔':'reflexion','🔥':'feu','🎉':'fete','❤️':'coeur','👍':'pouce-haut','👎':'pouce-bas','🦆':'canard','🐶':'chien'};
export function messageTime(at?:number){return at===undefined?'--:--:--':new Date(at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
type AudioState={buffers:Map<string,Promise<AudioBuffer>>;voices:AudioBufferSourceNode[]};
const contexts=new WeakMap<AudioContext,AudioState>();
function stateFor(ac:AudioContext){let state=contexts.get(ac);if(!state){state={buffers:new Map(),voices:[]};contexts.set(ac,state);}return state;}
function loadEmote(ac:AudioContext,emoji:string){
 const state=stateFor(ac);let buffer=state.buffers.get(emoji);
 if(!buffer){
  buffer=fetch('/audio/slapstick-v1/'+EMOTE_AUDIO[emoji]+'.wav').then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer();}).then(bytes=>ac.decodeAudioData(bytes)).catch(e=>{state.buffers.delete(emoji);throw e;});
  state.buffers.set(emoji,buffer);
 }
 return buffer;
}
/** Warm up on a user gesture, so received reactions need no later network delay. */
export function preloadEmoteSounds(ac:AudioContext){for(const emoji of EMOTE_OPTIONS)void loadEmote(ac,emoji).catch(()=>{});}
export async function playEmoteSound(ac:AudioContext,emoji:string,stillEnabled:()=>boolean=()=>true){
 if(!EMOTE_OPTIONS.includes(emoji as typeof EMOTE_OPTIONS[number]))return;
 const requested=ac.currentTime,buffer=await loadEmote(ac,emoji);
 if(!stillEnabled()||ac.state==='closed'||ac.currentTime-requested>1.5)return;
 const state=stateFor(ac);
 if(state.voices.length>=3){const oldest=state.voices.shift()!;oldest.stop();oldest.disconnect();}
 const source=ac.createBufferSource(),gain=ac.createGain();source.buffer=buffer;gain.gain.value=.45;
 source.connect(gain);gain.connect(ac.destination);state.voices.push(source);
 source.onended=()=>{source.disconnect();gain.disconnect();const index=state.voices.indexOf(source);if(index>=0)state.voices.splice(index,1);};
 source.start(ac.currentTime+.008);
}
