import {QUESTIONS, type State, type Player} from './game';

export type Tracking = {session:string; started:number; pulse:number; hash:string; streak:number};
export type AnalyticsEvent = {kind:string; at:number; player?:string; game?:string; round?:number; word?:string; value?:number; detail?:string};
export const calendar = (at:number) => {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(at);
 const part=(key:string)=>parts.find(p=>p.type===key)!.value;
 return {day:`${part('year')}-${part('month')}-${part('day')}`,hour:part('hour')};
};
export async function playerHash(id:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('kikalmo:analytics:v1:'+id))),v=>v.toString(16).padStart(2,'0')).join('');}
const tracking=(p:Player)=>p.tracking;
export function collector(room:string,now:number){
 const events:AnalyticsEvent[]=[];
 const ended:{tracking:Tracking;seen:number;reason:string}[]=[];
 const emit=(kind:string,s:State,p?:Player,value?:number,detail?:string,at=now)=>{
  const q=QUESTIONS[s.deck[s.round-1]];
  if(p&&!p.tracking)return;
  events.push({kind,at,...(p?.tracking?{player:p.tracking.hash}:{}),game:s.game,round:s.round,...(q?{word:q.theme+':'+q.answer}:{}),...(value!==undefined?{value}:{}),...(detail?{detail}: {})});
 };
 function transition(before:State,after:State){
  for(const p of before.players)if(!after.players.some(a=>a.id===p.id)&&tracking(p)){
   ended.push({tracking:p.tracking!,seen:now-p.seen>=12000?p.seen:now,reason:now-p.seen>=12000?'timeout':'leave'});
   emit(now-p.seen>=12000?'disconnect':'leave',before,p,undefined,undefined,p.seen);
  }
  if(before.phase==='guess'&&(after.phase!=='guess'||before.game!==after.game||before.round!==after.round)){
   const interrupted=after.phase==='empty';
   emit(interrupted?'round_abandoned':'round_completed',before,undefined,before.solveCount||0);emit('round_duration_ms',before,undefined,Math.max(0,Math.min(before.vacancy?.since??now,before.deadline)-before.started));
   if(!interrupted)emit(before.solveCount?'round_solved':'round_unsolved',before);
   for(const p of after.players){const old=before.players.find(x=>x.id===p.id);if(!old||!p.tracking)continue;
    p.tracking.streak=old.solved?p.tracking.streak+1:0;
    if(old.solved)emit('streak',before,p,p.tracking.streak);
   }
  }
  if(before.game&&before.phase!=='empty'&&before.phase!=='podium'&&after.phase==='empty'){emit('match_abandoned',before);if(before.telemetryMatchStarted)emit('abandoned_match_duration_ms',before,undefined,now-before.telemetryMatchStarted);}
  if(after.phase==='podium'&&before.phase!=='podium'){
   emit('match_completed',after,undefined,after.players.length);if(after.telemetryMatchStarted)emit('match_duration_ms',after,undefined,now-after.telemetryMatchStarted);
   for(const p of after.players){emit('match_score',after,p,p.score);if(p.id===after.champion)emit('victory',after,p);}
  }
  if(after.game!==before.game&&after.phase==='countdown'){
   emit('match_started',after,undefined,after.players.length);
   for(const p of after.players)emit('match_participation',after,p);
  }
  if(after.phase==='guess'&&(before.phase!=='guess'||before.round!==after.round||before.game!==after.game)){
   emit('round_started',after,undefined,after.players.length);
   for(const p of after.players)emit('round_participation',after,p);
  }
 }
 async function attach(p:Player,s:State,invited=false,allowed=true){
  if(!allowed){delete p.tracking;return;}
  if(!p.tracking){p.tracking={session:crypto.randomUUID(),started:now,pulse:now,hash:await playerHash(p.id),streak:0};emit('session_started',s,p);if(invited)emit('invitation_join',s,p);emit('presence',s,p);}
 }
 function pulse(p:Player,s:State){if(p.tracking&&(now-p.tracking.pulse>=60000||calendar(now).day!==calendar(p.tracking.pulse).day)){emit('presence',s,p);p.tracking.pulse=now;}}
 function action(kind:string,result:string,s:State,p:Player,message?:string){
  if(kind==='answer'&&['correct','incorrect','close'].includes(result)){
   emit('guess_'+result,s,p);
   if(result==='correct'){
    const ms=Math.max(0,now-s.started);emit('solve_ms',s,p,ms);emit(ms>=10000?'solve_after_hint':'solve_before_hint',s,p);
    emit('points',s,p,p.gain);if(p.solveRank===1)emit('first_solve_ms',s,p,ms);
   }
  }
  if(result==='sent')emit(kind==='emote'?'emote':'chat',s,p,undefined,kind==='emote'?message:undefined);
 }
 return {events,ended,emit,transition,attach,pulse,action,room,now};
}

// Every telemetry write is gated by the same revision AND an unpredictable nonce.
// D1 batch runs atomically: a losing room CAS cannot create analytics or sessions.
export function telemetryStatements(db:D1Database,c:ReturnType<typeof collector>,s:State,revision:number,nonce:string,actor:string,oldSeen:number){
 const guard='EXISTS (SELECT 1 FROM rooms WHERE id=? AND revision=? AND json_extract(state,\'$.telemetryCommit\')=?)';
 const bind=[c.room,revision,nonce];const statements:D1PreparedStatement[]=[];
 if(c.events.length){const {day}=calendar(c.now);statements.push(db.prepare(`INSERT INTO analytics_commits(id,at,day,room,events) SELECT ?,?,?,?,? WHERE ${guard}`).bind(nonce,c.now,day,c.room,JSON.stringify(c.events.map(e=>({...e,...calendar(e.at)}))),...bind));}
 for(const end of c.ended)statements.push(db.prepare(`UPDATE analytics_sessions SET ended=?,reason=?,active_ms=active_ms+CASE WHEN ?-last_seen<12000 THEN max(0,?-last_seen) ELSE 0 END WHERE id=? AND ${guard}`).bind(end.seen,end.reason,end.seen,end.seen,end.tracking.session,...bind));
 const p=s.players.find(p=>p.id===actor),t=p?.tracking;
 if(p&&t){
  const delta=oldSeen&&c.now-oldSeen<12000?Math.max(0,c.now-oldSeen):0;
  statements.push(db.prepare(`INSERT INTO analytics_sessions(id,player,room,started,last_seen,active_ms) SELECT ?,?,?,?,?,? WHERE ${guard} ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen,active_ms=analytics_sessions.active_ms+excluded.active_ms`).bind(t.session,t.hash,c.room,t.started,c.now,delta,...bind));
 }
 return statements;
}

export async function operational(db:D1Database,kind:string,value=0,detail?:string,id?:string){
 const at=Date.now(),date=calendar(at);
 try{await db.prepare('INSERT OR IGNORE INTO analytics_commits(id,at,day,room,events) VALUES (?,?,?,?,?)').bind(id||crypto.randomUUID(),at,date.day,'technical',JSON.stringify([{kind,at,value,...date,...(detail?{detail}:{})}])).run();}catch{console.error('Kikalmo telemetry unavailable:',kind);}
}
