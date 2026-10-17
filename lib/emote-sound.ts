/** Short cartoon foley: rubber pitch bends, voiced formants and soft percussive pops. */
export const EMOTE_OPTIONS=['👏','😂','🤔','🔥','🎉','❤️','👍','👎','🦆','🐶'] as const;
export function messageTime(at?:number){return at===undefined?'--:--:--':new Date(at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
export function playEmoteSound(ac:AudioContext,emoji:string){
 if(!EMOTE_OPTIONS.includes(emoji as typeof EMOTE_OPTIONS[number]))return;
 const start=ac.currentTime+.008;
 const output=ac.createGain(),limiter=ac.createDynamicsCompressor();
 output.gain.value=.55;limiter.threshold.value=-20;limiter.knee.value=14;limiter.ratio.value=5;limiter.attack.value=.003;limiter.release.value=.08;
 limiter.connect(output);output.connect(ac.destination);
 let voices=0;
 const ended=(nodes:AudioNode[])=>()=>{nodes.forEach(n=>n.disconnect());if(--voices===0){limiter.disconnect();output.disconnect();}};
 function voice(pitches:number[],delay:number,duration:number,type:OscillatorType='triangle',volume=.12,formant?:number){
  const o=ac.createOscillator(),g=ac.createGain(),at=start+delay;const nodes:AudioNode[]=[o,g];o.type=type;
  o.frequency.setValueAtTime(pitches[0],at);
  pitches.slice(1).forEach((hz,i)=>o.frequency.exponentialRampToValueAtTime(Math.max(30,hz),at+(i+1)*duration/(pitches.length-1)));
  g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(volume,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  if(formant){const filter=ac.createBiquadFilter();filter.type='bandpass';filter.frequency.setValueAtTime(formant,at);filter.frequency.exponentialRampToValueAtTime(formant*.62,at+duration);filter.Q.value=2.2;nodes.push(filter);o.connect(filter);filter.connect(g);}else o.connect(g);
  g.connect(limiter);voices++;o.onended=ended(nodes);o.start(at);o.stop(at+duration+.015);
 }
 function noise(delay:number,duration:number,frequency:number,volume=.12){
  const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*duration),ac.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
  const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain(),at=start+delay;
  source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(frequency,at);filter.frequency.exponentialRampToValueAtTime(frequency*.65,at+duration);filter.Q.value=.8;
  g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  source.connect(filter);filter.connect(g);g.connect(limiter);voices++;source.onended=ended([source,filter,g]);source.start(at);source.stop(at+duration+.015);
 }
 switch(emoji){
  case '👏':for(let i=0;i<3;i++){noise(i*.14,.085,1800,.3);voice([330,120],i*.14,.065,'triangle',.08);}break;
  case '😂':for(let i=0;i<4;i++){voice([330+i*25,440-i*18,180],i*.135,.12,'sawtooth',.16,900);voice([650,350],i*.135,.09,'sine',.025);}break;
  case '🤔':voice([310,360,650,510],0,.43,'sine',.11);voice([180,330],.36,.16,'triangle',.07,700);break;
  case '🔥':noise(0,.22,1200,.13);voice([120,700,430,620,470],.04,.38,'triangle',.17);noise(.35,.09,2400,.14);break;
  case '🎉':[523,659,784,1047].forEach((f,i)=>{voice([f*1.7,f,f*.99],i*.075,.19,'sine',.15);voice([f*3,f*2],i*.075,.065,'triangle',.025);});noise(.22,.1,2600,.1);break;
  case '❤️':voice([630,1100,320],0,.13,'sine',.16);voice([800,1400,420],.19,.15,'sine',.15);voice([1047,1047],.29,.2,'sine',.045);break;
  case '👍':voice([160,850,340,660,440],0,.36,'triangle',.19);voice([1100,1500,900],.27,.15,'sine',.055);break;
  case '👎':voice([380,300,310,180,100],0,.47,'sawtooth',.16,650);voice([130,85],.31,.19,'triangle',.08);break;
  case '🦆':for(let i=0;i<2;i++){voice([270,430,260,210],i*.23,.18,'sawtooth',.2,1150);noise(i*.23,.07,1200,.055);}break;
  case '🐶':for(let i=0;i<2;i++){voice([180,290,100,75],i*.25,.16,'sawtooth',.23,620);noise(i*.25,.1,650,.13);}break;
 }
}
