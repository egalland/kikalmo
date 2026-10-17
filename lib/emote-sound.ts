/** Original cartoon foley, rendered to PCM: no external files or loading delay. */
export const EMOTE_OPTIONS=['👏','😂','🤔','🔥','🎉','❤️','👍','👎','🦆','🐶'] as const;
export function messageTime(at?:number){return at===undefined?'--:--:--':new Date(at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
type Gesture={at:number;duration:number;pitch:number[];kind:'rubber'|'voice'|'pop'|'air'|'bell';volume:number;formants?:number[]};
const g=(kind:Gesture['kind'],at:number,duration:number,pitch:number[],volume:number,formants?:number[]):Gesture=>({kind,at,duration,pitch,volume,formants});
const gestures:Record<string,Gesture[]>={
 '👏':[0,.14,.29].flatMap(t=>[g('air',t,.065,[1800,800],.85),g('pop',t,.045,[220,85],.22)]),
 '😂':[0,.15,.3,.46].map((t,i)=>g('voice',t,.13,[285+i*22,390-i*18,210],.75,[780,1250])),
 '🤔':[g('voice',0,.28,[175,170,210],.42,[300,1000]),g('rubber',.28,.29,[330,390,820,700],.65)],
 '🔥':[g('air',0,.22,[420,2400],.48),g('rubber',.08,.33,[140,650,230,480,310],.7),g('air',.28,.12,[2600,1000],.38)],
 '🎉':[g('rubber',0,.16,[190,850,490],.5),...[660,830,990].map((p,i)=>g('bell',.1+i*.095,.3,[p,p*.995],.43)),g('air',.05,.08,[2800,1900],.4)],
 '❤️':[g('pop',0,.13,[115,65],.7),g('pop',.16,.15,[145,75],.8),g('bell',.25,.35,[880,1175],.35)],
 '👍':[g('rubber',0,.32,[180,720,300,570,390,470],.8),g('bell',.22,.2,[1320,1320],.25)],
 '👎':[g('voice',0,.43,[260,230,130,90],.7,[500,950]),g('rubber',.3,.18,[160,75],.35)],
 '🦆':[0,.25].flatMap(t=>[g('voice',t,.2,[250,410,250,190],.85,[1050,1800]),g('air',t,.05,[1100,650],.12)]),
 '🐶':[0,.27].flatMap(t=>[g('voice',t,.17,[140,225,100,65],.8,[480,1350]),g('air',t+.015,.11,[650,300],.42)]),
};
/** Deterministic PCM lets us test the exact sound played by the browser. */
export function renderEmoteSamples(emoji:string,sampleRate:number):Float32Array|null{
 if(!EMOTE_OPTIONS.includes(emoji as typeof EMOTE_OPTIONS[number]))return null;const events=gestures[emoji];
 const duration=Math.max(...events.map(e=>e.at+e.duration))+.025;
 const samples=new Float32Array(Math.ceil(duration*sampleRate));let seed=1234567;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/2147483648-1;};
 for(const e of events){
  const offset=Math.round(e.at*sampleRate),length=Math.round(e.duration*sampleRate);let phase=0,low=0;
  for(let i=0;i<length&&offset+i<samples.length;i++){
   const u=i/length,t=i/sampleRate,p=u*(e.pitch.length-1),k=Math.min(Math.floor(p),e.pitch.length-2);
   const hz=e.pitch[k]*Math.pow(e.pitch[k+1]/e.pitch[k],p-k);phase+=2*Math.PI*hz/sampleRate;
   const attack=Math.min(1,t/.008),tail=Math.pow(1-u,e.kind==='bell'?2.5:1.2);let value=0;
   if(e.kind==='voice'){
    // Moving vocal pitch with resonant vowel bands, breath and a rounded glottal pulse.
    for(let h=1;h<=12;h++){
     if(h*hz>sampleRate*.45)break;
     const resonance=(e.formants||[700,1200]).reduce((sum,f)=>sum+Math.exp(-Math.pow((h*hz-f)/(f*.24),2)),0);
     value+=Math.sin(phase*h+.035*Math.sin(t*40))*(.12/h+resonance*.23/Math.sqrt(h));
    }
    value+=random()*.025;
   }else if(e.kind==='air'){
    const n=random(),a=1-Math.exp(-2*Math.PI*Math.min(hz,sampleRate*.4)/sampleRate);low+=a*(n-low);value=(n-low)*1.4;
   }else if(e.kind==='bell'){
    value=Math.sin(phase)*.65+Math.sin(phase*2.76)*.18*Math.exp(-u*10)+Math.sin(phase*4.07)*.1*Math.exp(-u*18);
   }else if(e.kind==='pop'){
    value=Math.sin(phase)*Math.exp(-u*8)+random()*.12*Math.exp(-u*25);
   }else{
    // Elastic wobble: uneven overtones decay faster than the fundamental.
    const wobble=1+.025*Math.sin(t*95)*Math.exp(-u*3);
    value=Math.sin(phase*wobble)*.75+Math.sin(phase*2)*.2*Math.exp(-u*5)+Math.sin(phase*3)*.08*Math.exp(-u*10);
   }
   samples[offset+i]+=value*attack*tail*e.volume;
  }
 }
 // Equal headroom across emotes, soft saturation, and exact silent edges avoid clicks.
 let peak=0;for(const value of samples)peak=Math.max(peak,Math.abs(value));
 const gain=.58/Math.max(peak,.001);
 for(let i=0;i<samples.length;i++)samples[i]=Math.tanh(samples[i]*gain)*.8;
 samples[0]=0;samples[samples.length-1]=0;return samples;
}
const contexts=new WeakMap<AudioContext,{buffers:Map<string,AudioBuffer>;voices:AudioBufferSourceNode[]}>();
export function playEmoteSound(ac:AudioContext,emoji:string){
 if(!EMOTE_OPTIONS.includes(emoji as typeof EMOTE_OPTIONS[number]))return;
 let state=contexts.get(ac);if(!state){state={buffers:new Map(),voices:[]};contexts.set(ac,state);}
 let buffer=state.buffers.get(emoji);
 if(!buffer){const pcm=renderEmoteSamples(emoji,ac.sampleRate)!;buffer=ac.createBuffer(1,pcm.length,ac.sampleRate);buffer.getChannelData(0).set(pcm);state.buffers.set(emoji,buffer);}
 // Bound a burst of simultaneous room reactions; each source cleans itself up.
 if(state.voices.length>=3){const oldest=state.voices.shift()!;oldest.stop();oldest.disconnect();}
 const source=ac.createBufferSource(),gain=ac.createGain();source.buffer=buffer;gain.gain.value=.45;
 source.connect(gain);gain.connect(ac.destination);state.voices.push(source);
 source.onended=()=>{source.disconnect();gain.disconnect();const index=state!.voices.indexOf(source);if(index>=0)state!.voices.splice(index,1);};
 source.start(ac.currentTime+.008);
}
