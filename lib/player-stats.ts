export type PersonalEvent={id:string;day:string;room:string;kind:string;value:number;at:number;source:string};
export type PersonalSession={id:string;room:string;started:number;last_seen:number;active_ms:number;source:string};
export type PersonalDaily={id:string;day:string;tries:number;solved_at:number|null;at:number;source:string};
export type PersonalArchive={format:'kikalmo-personal-stats';version:1;events:PersonalEvent[];sessions:PersonalSession[];daily:PersonalDaily[]};
const validDay=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
const num=(v:unknown,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
const text=(v:unknown,max=120)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f]/.test(v);
export function validateArchive(raw:unknown,now=Date.now()):PersonalArchive{
 if(!raw||typeof raw!=='object')throw Error('Fichier invalide.');const a=raw as PersonalArchive;
 if(a.format!=='kikalmo-personal-stats'||a.version!==1||![a.events,a.sessions,a.daily].every(Array.isArray)||a.events.length+a.sessions.length+a.daily.length>20000)throw Error('Format de sauvegarde Kikalmo invalide ou trop volumineux.');
 const stamp=(n:unknown)=>num(n,now+86400000);
 for(const e of a.events)if(!e||!text(e.id)||!validDay(e.day)||!text(e.room,40)||!text(e.kind,40)||!num(e.value,1e10)||!stamp(e.at))throw Error('Événement invalide dans la sauvegarde.');
 for(const s of a.sessions)if(!s||!text(s.id)||!text(s.room,40)||!stamp(s.started)||!stamp(s.last_seen)||s.last_seen<s.started||!num(s.active_ms,s.last_seen-s.started+12000))throw Error('Session invalide dans la sauvegarde.');
 for(const d of a.daily)if(!d||!text(d.id)||!validDay(d.day)||!num(d.tries,1000)||!Number.isInteger(d.tries)||!stamp(d.at)||(d.solved_at!==null&&!stamp(d.solved_at)))throw Error('Défi invalide dans la sauvegarde.');
 return a;
}
export async function collectArchive(db:D1Database,players:string[]):Promise<PersonalArchive>{
 const out:PersonalArchive={format:'kikalmo-personal-stats',version:1,events:[],sessions:[],daily:[]};if(!players.length)return out;
 if(players.length>90){const collected:PersonalArchive={format:'kikalmo-personal-stats',version:1,events:[],sessions:[],daily:[]};for(let i=0;i<players.length;i+=90){const a=await collectArchive(db,players.slice(i,i+90));collected.events.push(...a.events);collected.sessions.push(...a.sessions);collected.daily.push(...a.daily);}const dedup=<T extends {id:string}>(rows:T[])=>[...new Map(rows.map(r=>[r.id,r])).values()];collected.events=dedup(collected.events);collected.sessions=dedup(collected.sessions.sort((a,b)=>a.active_ms-b.active_ms));collected.daily=dedup(collected.daily.sort((a,b)=>a.at-b.at));return collected;}
 const marks=players.map(()=>'?').join(',');const r=await db.batch([
 db.prepare(`SELECT id,day,room,kind,value,at,source FROM personal_events WHERE player IN (${marks}) ORDER BY source DESC`).bind(...players),
 db.prepare(`SELECT id,room,started,last_seen,active_ms,source FROM personal_sessions WHERE player IN (${marks}) ORDER BY active_ms DESC`).bind(...players),
 db.prepare(`SELECT id,day,tries,solved_at,at,source FROM personal_daily WHERE player IN (${marks}) ORDER BY at DESC`).bind(...players),
 ]);
 const unique=<T extends {id:string}>(items:T[])=>[...new Map(items.slice().reverse().map(x=>[x.id,x])).values()];
 out.events=unique(r[0].results as PersonalEvent[]);out.sessions=unique(r[1].results as PersonalSession[]);out.daily=unique(r[2].results as PersonalDaily[]);return out;
}
export function summarize(a:PersonalArchive,from:string,to:string){
 const events=a.events.filter(e=>e.day>=from&&e.day<=to),daily=a.daily.filter(e=>e.day>=from&&e.day<=to);const sessions=a.sessions.filter(s=>{const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(s.started);return day>=from&&day<=to;});
 const metrics=(es:PersonalEvent[])=>{const count=(k:string)=>es.filter(e=>e.kind===k).length,sum=(k:string)=>es.filter(e=>e.kind===k).reduce((n,e)=>n+e.value,0);return {games:count('match_participation'),completed:count('match_score'),wins:count('victory'),rounds:count('round_participation'),correct:count('guess_correct'),incorrect:count('guess_incorrect'),close:count('guess_close'),points:sum('points'),solveMs:sum('solve_ms'),solves:count('solve_ms'),bestStreak:Math.max(0,...es.filter(e=>e.kind==='streak').map(e=>e.value))};};
 return {from,to,totals:{...metrics(events),sessions:sessions.length,activeMs:sessions.reduce((n,s)=>n+s.active_ms,0),dailyPlayed:daily.length,dailySolved:daily.filter(d=>d.solved_at!==null).length},days:[...new Set(events.map(e=>e.day))].sort().map(day=>({day,...metrics(events.filter(e=>e.day===day))})),themes:[...new Set(events.map(e=>e.room))].map(room=>({room,...metrics(events.filter(e=>e.room===room))})),daily:daily.sort((a,b)=>b.day.localeCompare(a.day)),imported:events.filter(e=>e.source==='imported').length};
}
export async function importArchive(db:D1Database,player:string,a:PersonalArchive,now=Date.now()){
 const cutoff=now-395*86400000;const statements:D1PreparedStatement[]=[];
 for(const e of a.events.filter(e=>e.at>=cutoff))statements.push(db.prepare("INSERT OR IGNORE INTO personal_events(player,id,day,room,kind,value,at,source) VALUES(?,?,?,?,?,?,?,'imported')").bind(player,e.id,e.day,e.room,e.kind,e.value,e.at));
 for(const s of a.sessions.filter(s=>s.last_seen>=cutoff))statements.push(db.prepare("INSERT INTO personal_sessions(player,id,room,started,last_seen,active_ms,source) VALUES(?,?,?,?,?,?,'imported') ON CONFLICT(player,id) DO UPDATE SET last_seen=max(last_seen,excluded.last_seen),active_ms=max(active_ms,excluded.active_ms)").bind(player,s.id,s.room,s.started,s.last_seen,s.active_ms));
 for(const d of a.daily.filter(d=>d.at>=cutoff))statements.push(db.prepare("INSERT INTO personal_daily(player,id,day,tries,solved_at,at,source) VALUES(?,?,?,?,?,?,'imported') ON CONFLICT(player,id) DO UPDATE SET tries=CASE WHEN excluded.at>at THEN excluded.tries ELSE tries END,solved_at=CASE WHEN excluded.at>at THEN excluded.solved_at ELSE solved_at END,at=max(at,excluded.at)").bind(player,d.id,d.day,d.tries,d.solved_at,d.at));
 // Retries are idempotent; a failed batch is reported as a failure and can be retried.
 for(let i=0;i<statements.length;i+=100)await db.batch(statements.slice(i,i+100));return statements.length;
}
