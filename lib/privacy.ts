import {settleDailyStatement} from './economy';
import {dailyDate} from './daily';
import {playerHash} from './analytics';
import {fresh,type State} from './game';
export const CONSENT_VERSION='v1';
export const cookieValue=(req:Request,key:string)=>req.headers.get('cookie')?.match(new RegExp('(?:^|;\\s*)'+key+'=([^;]+)'))?.[1];
export const browserId=(req:Request,key:string)=>{const id=cookieValue(req,key);return id&&/^[a-f0-9-]{36}$/.test(id)?id:undefined;};
export const statsAllowed=(req:Request)=>cookieValue(req,'kk_consent')===CONSENT_VERSION+'-yes';
export const expireCookie=(key:string)=>`${key}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
export const consentCookie=(yes:boolean)=>`kk_consent=${CONSENT_VERSION}-${yes?'yes':'no'}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=15552000`;
export async function removeOptional(db:D1Database,req:Request){
 const player=browserId(req,'sv_player'),visitor=browserId(req,'kk_visitor');
 const statements:D1PreparedStatement[]=[];
 if(visitor)statements.push(db.prepare('DELETE FROM site_visitor_days WHERE visitor=?').bind(await playerHash('visit:'+visitor)));
 if(player){const hash=await playerHash(player);
  for(const [table,col] of [['personal_events','player'],['personal_sessions','player'],['personal_daily','player'],['player_stat_links','player'],['analytics_sessions','player'],['analytics_player_days','player'],['analytics_players','id']])statements.push(db.prepare(`DELETE FROM ${table} WHERE ${col}=?`).bind(hash));
  // Remove only this player's events; retain other participants' events and anonymous rollups.
  statements.push(db.prepare("UPDATE analytics_commits SET events=coalesce((SELECT json_group_array(json(value)) FROM json_each(analytics_commits.events) WHERE coalesce(json_extract(value,'$.player'),'')<>?), '[]') WHERE EXISTS (SELECT 1 FROM json_each(analytics_commits.events) WHERE json_extract(value,'$.player')=?)").bind(hash,hash));
 }
 if(player)await scrubRooms(db,player,false);
 if(statements.length)await db.batch(statements);
}
export async function scrubRooms(db:D1Database,player:string,erase:boolean){
 const rooms=await db.prepare('SELECT id FROM rooms').all<{id:string}>();
 for(const room of rooms.results){let done=false;for(let attempt=0;attempt<10;attempt++){
  const row=await db.prepare('SELECT state,revision FROM rooms WHERE id=?').bind(room.id).first<{state:string;revision:number}>();if(!row){done=true;break;}
  const s=JSON.parse(row.state) as State;
  for(const list of [s.players,s.vacancy?.players||[]])for(const p of list)if(p.id===player)delete p.tracking;
  if(erase){if(s.coinProgress)delete s.coinProgress[player];s.players=s.players.filter(p=>p.id!==player);if(s.vacancy)s.vacancy.players=s.vacancy.players.filter(p=>p.id!==player);s.messages=s.messages?.filter(m=>m.player!==player&&m.player!==player.slice(0,8));if(s.champion===player)delete s.champion;if(!s.players.length&&!s.vacancy?.players.length)Object.assign(s,fresh(),{vacancy:undefined,messages:[]});}
  const r=await db.prepare('UPDATE rooms SET state=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(s),room.id,row.revision).run();if(r.meta.changes){done=true;break;}
 }if(!done)throw Error('Un salon est occupé. Réessaie dans un instant.');}
}
export async function purgeExpired(db:D1Database,now=Date.now()){
 const day=(days:number)=>new Date(now-days*86400000).toISOString().slice(0,10);
 await settleDailyStatement(db,dailyDate(now),now).run();
 await db.batch([
  db.prepare('DELETE FROM direct_messages WHERE created_at<?').bind(now-90*86400000),
  db.prepare('DELETE FROM personal_events WHERE at<?').bind(now-395*86400000),
  db.prepare('DELETE FROM personal_sessions WHERE last_seen<?').bind(now-395*86400000),
  db.prepare('DELETE FROM personal_daily WHERE at<?').bind(now-395*86400000),
  db.prepare('DELETE FROM daily_players WHERE day<?').bind(day(30)),
  db.prepare('DELETE FROM daily_challenges WHERE day<?').bind(day(30)),
  db.prepare('DELETE FROM analytics_commits WHERE at<?').bind(now-90*86400000),
  db.prepare('DELETE FROM analytics_sessions WHERE last_seen<?').bind(now-90*86400000),
  db.prepare('DELETE FROM analytics_player_days WHERE day<?').bind(day(90)),
  db.prepare('DELETE FROM analytics_players WHERE last_seen<?').bind(now-90*86400000),
  db.prepare('DELETE FROM site_visitor_days WHERE day<?').bind(day(90)),
  db.prepare('DELETE FROM analytics_daily WHERE day<?').bind(day(395)),
  db.prepare("UPDATE rooms SET state=?,revision=revision+1 WHERE NOT EXISTS (SELECT 1 FROM json_each(json_extract(state,'$.players')) WHERE json_extract(value,'$.seen')>=?) AND coalesce(json_extract(state,'$.vacancy.until'),0)<?").bind(JSON.stringify(fresh()),now-86400000,now-86400000),
 ]);
}
