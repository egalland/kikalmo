import type {State} from '../../../lib/game';
import {env} from 'cloudflare:workers';
import {sameOrigin,privateHeaders} from '../../../lib/admin-auth';
import {browserId,cookieValue,statsAllowed,consentCookie,expireCookie,removeOptional,scrubRooms,purgeExpired} from '../../../lib/privacy';
import {playerHash} from '../../../lib/analytics';
export const dynamic='force-dynamic';
function response(data:unknown,cookies:string[]=[],status=200){const headers=new Headers(privateHeaders);for(const c of cookies)headers.append('Set-Cookie',c);return Response.json(data,{status,headers});}
export async function GET(req:Request){try{
 await purgeExpired(env.DB!);
 if(new URL(req.url).searchParams.get('export')!=='1')return response({choice:cookieValue(req,'kk_consent')==='v1-yes'?'yes':cookieValue(req,'kk_consent')==='v1-no'?'no':null});
 const id=browserId(req,'sv_player'),visitor=browserId(req,'kk_visitor');
 const data:Record<string,unknown>={generatedAt:new Date().toISOString(),consent:statsAllowed(req),daily:[],sessions:[],visits:[],events:[],rooms:[]};
 if(id){const hash=await playerHash(id);data.personal={events:(await env.DB!.prepare('SELECT id,day,room,kind,value,at,source FROM personal_events WHERE player=?').bind(hash).all()).results,sessions:(await env.DB!.prepare('SELECT id,room,started,last_seen,active_ms,source FROM personal_sessions WHERE player=?').bind(hash).all()).results,daily:(await env.DB!.prepare('SELECT id,day,tries,solved_at,at,source FROM personal_daily WHERE player=?').bind(hash).all()).results};
 data.daily=(await env.DB!.prepare('SELECT day,name,avatar,state,tries,solved_at,started_at,last_seen FROM daily_players WHERE player=?').bind(id).all()).results;
 data.sessions=(await env.DB!.prepare('SELECT room,started,last_seen,active_ms,ended,reason FROM analytics_sessions WHERE player=?').bind(hash).all()).results;
 data.events=(await env.DB!.prepare("SELECT e.value AS event FROM analytics_commits c,json_each(c.events) e WHERE json_extract(e.value,'$.player')=?").bind(hash).all()).results;
 const rooms=await env.DB!.prepare('SELECT id,state FROM rooms').all<{id:string;state:string}>();data.rooms=rooms.results.flatMap(r=>{const s=JSON.parse(r.state) as State;return [...s.players,...(s.vacancy?.players||[])].filter(p=>p.id===id).map(p=>({room:r.id,name:p.name,avatar:p.avatar,score:p.score,messages:(s.messages||[]).filter(m=>m.player===id).map(({text,at,kind})=>({text,at,kind}))}));});
 }
 if(visitor)data.visits=(await env.DB!.prepare('SELECT day,first_seen,last_seen,views FROM site_visitor_days WHERE visitor=?').bind(await playerHash('visit:'+visitor)).all()).results;
 const r=response(data);r.headers.set('Content-Disposition','attachment; filename="Kikalmo_mes_donnees.json"');return r;
 }catch{return response({error:'Les réglages sont indisponibles. Réessaie.'},[],503);}}
export async function POST(req:Request){if(!sameOrigin(req))return response({error:'Origine refusée.'},[],403);try{const b=await req.json() as {statistics?:boolean};if(typeof b.statistics!=='boolean')return response({error:'Choix invalide.'},[],400);if(!b.statistics)await removeOptional(env.DB!,req);return response({choice:b.statistics?'yes':'no'},[consentCookie(b.statistics),...(!b.statistics?[expireCookie('kk_visitor'),expireCookie('kk_stats')]:[])]);}catch{return response({error:'Le choix n’a pas pu être enregistré. Réessaie.'},[],503);}}
export async function DELETE(req:Request){if(!sameOrigin(req))return response({error:'Origine refusée.'},[],403);try{await removeOptional(env.DB!,req);const id=browserId(req,'sv_player');if(id){await scrubRooms(env.DB!,id,true);await env.DB!.prepare('DELETE FROM daily_players WHERE player=?').bind(id).run();}return response({deleted:true},[expireCookie('sv_player'),expireCookie('kk_visitor'),expireCookie('kk_stats'),consentCookie(false)]);}catch{return response({error:'L’effacement n’a pas pu être terminé. Réessaie.'},[],503);}}
