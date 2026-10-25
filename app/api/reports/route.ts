import {resolvePlayer} from '../../../lib/account-identity';
import {env} from 'cloudflare:workers';
import {QUESTIONS,view,type State} from '../../../lib/game';
import {sameOrigin,privateHeaders} from '../../../lib/admin-auth';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:privateHeaders});
export async function POST(req:Request){try{
 if(!sameOrigin(req))return reply({error:'Origine refusée.'},403);
 const player=await resolvePlayer(env.DB!,req);
 if(!player)return reply({error:'Rejoignez un salon pour signaler un problème.'},401);
 const raw=await req.text();if(raw.length>3000)return reply({error:'Signalement trop long.'},413);
 const b=JSON.parse(raw),kind=b.kind;
 const reasons=kind==='question'?['error','category','variant','difficulty','hint']:kind==='message'?['harassment','abuse','spam']:[];
 if(!reasons.includes(b.reason)||typeof b.room!=='string'||typeof b.detail!=='string'||b.detail.length>500)return reply({error:'Signalement invalide.'},400);
 const db=env.DB!,row=await db.prepare('SELECT state FROM rooms WHERE id=?').bind(b.room).first<{state:string}>(),s:State|undefined=row?JSON.parse(row.state):undefined;
 if(!s||!s.players.some(p=>p.id===player&&Date.now()-p.seen<12000))return reply({error:'Ce salon n’est plus actif pour vous.'},403);
 let itemKey:string,context:unknown;
 if(kind==='question'){
  if(b.game!==s.game||b.round!==s.round||!['reveal','podium'].includes(s.phase))return reply({error:'Signalez la question lors de la révélation de sa réponse.'},409);
  const index=s.deck[s.round-1],q=QUESTIONS[index];if(!q)return reply({error:'Question introuvable.'},404);
  itemKey=String(index);context={answer:q.answer,theme:q.theme,hint:view(s,player,Date.now()).question?.hint};
 }else{
  const m=view(s,player,Date.now()).messages.find(m=>m.id===b.message);
  if(!m||m.kind!=='chat'||m.player==='me')return reply({error:'Ce message de discussion n’est pas disponible.'},404);
  itemKey=m.id;context={name:m.name,text:m.text,at:m.at,player:m.player};
 }
 const now=Date.now(),id=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(player+'|'+kind+'|'+b.room+'|'+itemKey));
 const key=Array.from(new Uint8Array(id),v=>v.toString(16).padStart(2,'0')).join('');
 await db.prepare('DELETE FROM player_reports WHERE created_at<?').bind(now-90*86400000).run();
 const existing=await db.prepare('SELECT id FROM player_reports WHERE id=?').bind(key).first();if(existing)return reply({sent:true});
 const result=await db.prepare(`INSERT OR IGNORE INTO player_reports(id,reporter,kind,room,item_key,reason,detail,context,created_at,status) SELECT ?,?,?,?,?,?,?,?,?,'open' WHERE (SELECT count(*) FROM player_reports WHERE reporter=? AND created_at>?)<10`).bind(key,player,kind,b.room,itemKey,b.reason,b.detail.trim(),JSON.stringify(context),now,player,now-3600000).run();
 return result.meta.changes?reply({sent:true}):reply({error:'Limite de dix signalements par heure atteinte.'},429);
 }catch{return reply({error:'Signalement non enregistré. Réessayez.'},503);}}
