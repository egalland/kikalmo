import questionBank from './question-bank.json';
import questionClues from './question-clues.json';
import clueSources from './question-clue-sources.json';
import type {Avatar} from './profile';
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
export function mask(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/gi,'oe').replace(/æ/gi,'ae').replace(/[aeiouy]/gi,'').toUpperCase();}
export type Question={answer:string;theme:string;wiki:string;hint:string;aliases?:string[];wikiEn?:string;illustration?:{url:string|null;page:string|null;credit:string}};
export const QUESTIONS:Question[]=questionBank;
export type Player={tracking?:import('./analytics').Tracking;id:string;name:string;avatar?:Avatar;score:number;seen:number;solved:boolean;solveRank?:number;gain:number;tries:number;reaction?:{id:string;text:string;at:number}};
export const EMOTES=['👏','😂','🤔','🔥','🎉','❤️','👍','👎','🦆','🐶'] as const;
export type Message={id:string;player:string;name:string;text:string;kind:'guess'|'correct'|'chat'|'emote';game:string;round:number;private:boolean;at?:number;solveRank?:number;result?:'incorrect'|'close'};
export type CoinProgress={attempts:number[];solo:number[];first:number[];completed?:boolean};
export type CoinAward={kind:'round'|'solo'|'completion';player:string;game:string;index:number;amount:number};
export type State={recentQuestions?:number[];coinProgress?:Record<string,CoinProgress>;vacancy?:{since:number;until:number;players:Player[]};telemetryCommit?:string;telemetryMatchStarted?:number;players:Player[];phase:'empty'|'countdown'|'guess'|'reveal'|'podium';deadline:number;started:number;round:number;deck:number[];game:string;solveCount?:number;champion?:string;messages?:Message[]};
// Kept with the match, rather than the player object, so reconnecting cannot reset rewards.
export function roomCoinAwards(before:State,after:State):CoinAward[]{
 if(!after.game||before.game!==after.game)return [];
 const awards:CoinAward[]=[];
 for(const [player,progress] of Object.entries(after.coinProgress||{})){
  const previous=before.coinProgress?.[player];
  for(const round of progress.first)if(!previous?.first.includes(round))awards.push({kind:'round',player,game:after.game,index:round,amount:1});
  const previousSolo=Math.min(3,Math.floor((previous?.solo.length||0)/3)),solo=Math.min(3,Math.floor(progress.solo.length/3));
  for(let index=previousSolo+1;index<=solo;index++)awards.push({kind:'solo',player,game:after.game,index,amount:1});
  if(before.phase!=='podium'&&after.phase==='podium'&&progress.attempts.length>=5&&after.players.some(p=>p.id===player)){progress.completed=true;awards.push({kind:'completion',player,game:after.game,index:0,amount:3});}
 }
 return awards;
}
export const fresh=():State=>({players:[],phase:'empty',deadline:0,started:0,round:0,deck:[],game:''});
export function begin(s:State,room:string,now:number){
 delete s.vacancy;delete s.coinProgress;
 const recent=[...new Set([...(s.recentQuestions||[]),...s.deck])].filter(i=>Number.isInteger(i)&&!!QUESTIONS[i]).slice(-100);
 const excluded=new Set(recent.map(i=>normalize(QUESTIONS[i].answer)));
 const candidates=QUESTIONS.map((q,i)=>({q,i})).filter(x=>(room==='general'||x.q.theme===room)&&!excluded.has(normalize(x.q.answer))).map(x=>x.i);
 for(let i=candidates.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 const chosen=new Set<string>();s.deck=[];
 for(const i of candidates){const key=normalize(QUESTIONS[i].answer);if(!chosen.has(key)){chosen.add(key);s.deck.push(i);if(s.deck.length===10)break;}}
 s.recentQuestions=recent;s.game=crypto.randomUUID();s.telemetryMatchStarted=now;s.round=0;s.phase='countdown';s.deadline=now+10000;s.solveCount=0;s.players.forEach(p=>{p.score=0;p.solved=false;p.solveRank=undefined;p.gain=0;p.tries=0;});
}
export const EMPTY_ROOM_GRACE_MS=10000;
// Keep a private snapshot of the last participants while the empty room is paused.
export function depart(s:State,id:string,now:number){
 const departing=s.players.filter(p=>p.id===id);
 s.players=s.players.filter(p=>p.id!==id);
 if(departing.length&&!s.players.length&&s.phase!=='empty'&&!s.vacancy)
  s.vacancy={since:now,until:now+EMPTY_ROOM_GRACE_MS,players:departing};
 return s;
}
export function advance(s:State,now:number){
 const previous=s.players;
 s.players=s.players.filter(p=>now-p.seen<12000);
 if(!s.players.length){
  if(!s.vacancy&&previous.length&&s.phase!=='empty'){
   const since=Math.max(...previous.map(p=>p.seen))+12000;
   s.vacancy={since,until:since+EMPTY_ROOM_GRACE_MS,players:previous};
  }
  return s.vacancy&&now<s.vacancy.until?s:{...fresh(),recentQuestions:[...new Set([...(s.recentQuestions||[]),...s.deck])].slice(-100)};
 }
 if(s.vacancy){
  const pause=Math.max(0,now-s.vacancy.since);
  s.deadline+=pause;if(s.started)s.started+=pause;
  delete s.vacancy;
 }
 if(s.champion&&!s.players.some(p=>p.id===s.champion))s.champion=undefined;
 if(s.phase==='guess'&&s.players.every(p=>p.solved)){s.phase='reveal';s.deadline=now+5000;}
 else if(now>=s.deadline){
  if(s.phase==='countdown'||s.phase==='reveal'&&s.round<10){s.round++;s.phase='guess';s.solveCount=0;s.started=now;s.deadline=now+20000;s.players.forEach(p=>{p.solved=false;p.solveRank=undefined;p.gain=0;p.tries=0;});}
  else if(s.phase==='guess'){s.phase='reveal';s.deadline=now+5000;}
  else if(s.phase==='reveal'){s.phase='podium';s.deadline=now+60000;const winner=[...s.players].sort((a,b)=>b.score-a.score||b.gain-a.gain)[0];s.champion=winner?.score?winner.id:undefined;}
 }
 return s;
}
// Optimal string alignment distance also handles swapped neighbouring letters.
export function distance(a:string,b:string){const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+Number(a[i-1]!==b[j-1]));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);}return d[a.length][b.length];}
export function matchAnswer(answer:string,q:Question){const n=normalize(answer);if(!n)return 'incorrect';const variants=[q.answer,...q.aliases||[]].map(normalize);if(variants.includes(n))return 'correct';// A different valid bank answer must not be accepted as a typo.
const another=QUESTIONS.some(other=>other!==q&&other.theme===q.theme&&normalize(other.answer)===n);let close=false;for(const v of variants){if(Math.abs(n.length-v.length)>2)continue;const d=distance(n,v);const tolerance=v.length>=8?1:0;if(d<=tolerance&&!another)return 'correct';if(d<=Math.max(1,tolerance+1)&&n.length>=3)close=true;}return close?'close':'incorrect';}
function append(s:State,p:Player,text:string,kind:Message['kind'],now:number,privateMessage=false,result?:'incorrect'|'close'){s.messages=[...(s.messages||[]),{id:crypto.randomUUID(),player:p.id.slice(0,8),name:p.name,text,kind,game:s.game,round:s.round,private:privateMessage,at:now,...(result?{result}:{}),...(kind==='correct'?{solveRank:p.solveRank}:{})}].slice(-100);}
export function communicate(s:State,id:string,text:string,now:number,emote=false){const p=s.players.find(x=>x.id===id);if(!p)return 'wait';if(emote){if(!EMOTES.includes(text as any))return 'invalid';p.reaction={id:crypto.randomUUID(),text,at:now};return 'sent';}if(s.phase==='guess'&&!p.solved||s.phase==='empty')return 'wait';const clean=text.trim().slice(0,200);if(!clean)return 'wait';append(s,p,clean,'chat',now,s.phase==='guess');return 'sent';}
export function submit(s:State,id:string,answer:string,now:number){const p=s.players.find(x=>x.id===id);if(s.phase!=='guess'||!p||p.solved)return 'wait';p.tries++;const q=QUESTIONS[s.deck[s.round-1]];const result=matchAnswer(answer,q);let coins:CoinProgress|undefined;if(normalize(answer)){s.coinProgress??={};coins=s.coinProgress[id]??={attempts:[],solo:[],first:[]};if(!coins.attempts.includes(s.round))coins.attempts.push(s.round);}if(result==='correct'){s.solveCount=(s.solveCount??s.players.filter(x=>x.solved).length)+1;p.solveRank=s.solveCount;if(coins){if(s.players.length===1){if(!coins.solo.includes(s.round)&&!coins.first.includes(s.round))coins.solo.push(s.round);}else if(p.solveRank===1&&!coins.first.includes(s.round)&&!coins.solo.includes(s.round))coins.first.push(s.round);}p.solved=true;p.gain=Math.max(100,Math.round(1000-900*(now-s.started)/20000));p.score+=p.gain;append(s,p,(p.solveRank===1?'a trouvé en premier ! +':'a trouvé ! +')+p.gain+' points','correct',now);return 'correct';}append(s,p,answer.trim().slice(0,200),'guess',now,false,result);return result;}
const clueKey=(q:Question)=>q.theme+':'+normalize(q.answer);
export function roundHint(q:Question){
 const candidates=[q.answer,...q.aliases||[]].map(normalize).filter(a=>a.length>=3);
 const safe=(text:string)=>text.trim()&&!candidates.some(a=>normalize(text).includes(a));
 const edited=(questionClues as Record<string,string>)[clueKey(q)];if(edited&&safe(edited))return edited;
 const description=q.hint.trim();
 const mainWord=q.answer.replace(/^(?:(?:le|la|les|un|une|des|the|a|an)\s+|l[’'])/i,'');
 const prefix=mainWord.match(/[\p{L}\p{N}]/gu)?.slice(0,normalize(mainWord).length>5?2:1).join('').toUpperCase();
 return (safe(description)?description+' ':'')+'Le mot principal commence par « '+prefix+' ».';
}
export function roundHintSource(q:Question){return (clueSources as Record<string,string>)[clueKey(q)];}
export function view(s:State,id:string,now:number,blocked:ReadonlySet<string>=new Set()){const q=QUESTIONS[s.deck[s.round-1]];const solved=s.players.find(p=>p.id===id)?.solved;const messages=(s.messages||[]).filter(m=>m.kind!=='emote'&&!(m.kind==='chat'&&blocked.has(m.player))&&(!m.private||m.game!==s.game||m.round!==s.round||s.phase!=='guess'||solved)).map(({private:privateMessage,...m})=>({...m,player:m.player===id.slice(0,8)?'me':m.player,private:privateMessage}));const progress=s.coinProgress?.[id];const roomCoinProgress={attemptedRounds:progress?.attempts.length||0,soloSolved:progress?.solo.length||0,earned:(progress?.first.length||0)+Math.min(3,Math.floor((progress?.solo.length||0)/3))+(progress?.completed?3:0),completionEarned:progress?.completed?3:0};return {...s,recentQuestions:undefined,coinProgress:undefined,roomCoinProgress,vacancy:undefined,telemetryCommit:undefined,telemetryMatchStarted:undefined,champion:s.champion===id?'me':s.champion?.slice(0,8),messages,players:s.players.map(({id:pid,tracking,...p})=>({...p,reaction:!blocked.has(pid.slice(0,8))&&p.reaction&&now-p.reaction.at<4500?p.reaction:undefined,id:pid===id?'me':pid.slice(0,8)})),deck:undefined,started:undefined,serverNow:now,question:q&&s.phase!=='countdown'?{masked:mask(q.answer),theme:q.theme,words:q.answer.split(/\s+/).length,...(s.phase==='guess'&&s.deadline-now<=10000?{clue:roundHint(q)}:{}),...(s.phase==='reveal'||s.phase==='podium'?{answer:q.answer,wiki:q.wiki,hint:roundHint(q),...(roundHintSource(q)?{hintSource:roundHintSource(q)}:{})}:{})}:null};}
