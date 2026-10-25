import {env} from 'cloudflare:workers';
import {friendCode} from '../../../lib/friends';
export const dynamic='force-dynamic';
const RETENTION=90*86400000;
const identity=(req:Request)=>req.headers.get('cookie')?.match(/(?:^|;\s*)sv_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const permission=`EXISTS(SELECT 1 FROM friend_links WHERE status='accepted' AND ((requester=? AND recipient=?) OR (requester=? AND recipient=?))) AND NOT EXISTS(SELECT 1 FROM friend_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?))`;
const pair=(player:string,peer:string)=>[player,peer,peer,player,player,peer,peer,player];
async function target(db:D1Database,player:string,code:string){
 if(!/^[A-F0-9]{16}$/.test(code))return null;
 const peer=await db.prepare('SELECT player,code,name FROM friend_profiles WHERE code=?').bind(code).first<{player:string;code:string;name:string}>();
 if(!peer||peer.player===player)return null;
 return await db.prepare(`SELECT 1 AS allowed WHERE ${permission}`).bind(...pair(player,peer.player)).first()?peer:null;
}
export async function GET(req:Request){try{
 const player=identity(req);if(!player)return response({conversations:[],messages:[],hasOlder:false});
 const db=env.DB!,url=new URL(req.url),code=friendCode(url.searchParams.get('code')),cutoff=Date.now()-RETENTION;
 if(!url.searchParams.has('code')){
  const result=await db.prepare(`SELECT p.code,
   (SELECT created_at FROM direct_messages m WHERE ((m.sender=? AND m.recipient=p.player) OR (m.recipient=? AND m.sender=p.player)) AND created_at>=? ORDER BY created_at DESC,id DESC LIMIT 1) AS lastAt,
   (SELECT created_at FROM direct_messages m WHERE m.sender=p.player AND m.recipient=? AND m.created_at>=? ORDER BY created_at DESC,id DESC LIMIT 1) AS lastIncomingAt,
   (SELECT id FROM direct_messages m WHERE m.sender=p.player AND m.recipient=? AND m.created_at>=? ORDER BY created_at DESC,id DESC LIMIT 1) AS lastIncomingId,
   (SELECT count(*) FROM direct_messages m WHERE m.sender=p.player AND m.recipient=? AND m.read_at IS NULL AND m.created_at>=?) AS unread
   FROM friend_profiles p JOIN friend_links l ON (l.requester=? AND l.recipient=p.player) OR (l.recipient=? AND l.requester=p.player)
   WHERE l.status='accepted' AND NOT EXISTS(SELECT 1 FROM friend_blocks b WHERE (b.owner=? AND b.target=p.player) OR (b.owner=p.player AND b.target=?))`).bind(player,player,cutoff,player,cutoff,player,cutoff,player,cutoff,player,player,player,player).all();
  return response({conversations:result.results});
 }
 const peer=await target(db,player,code);if(!peer)return response({error:'Cette conversation n’est pas disponible. Vérifiez votre liste d’amis.'},403);
 const beforeText=url.searchParams.get('before'),beforeId=url.searchParams.get('beforeId');
 if(beforeText!==null&&(!/^\d{1,16}$/.test(beforeText)||!beforeId||!/^[a-f0-9-]{36}$/.test(beforeId)))return response({error:'Page de messages invalide.'},400);
 const before=beforeText===null?Number.MAX_SAFE_INTEGER:Number(beforeText);
 const rows=await db.prepare(`SELECT id,CASE WHEN sender=? THEN 'me' ELSE 'peer' END AS fromMe,text,created_at AS at,read_at AS readAt FROM direct_messages
  WHERE ((sender=? AND recipient=?) OR (sender=? AND recipient=?)) AND created_at>=?
  AND (created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT 51`).bind(player,player,peer.player,peer.player,player,cutoff,before,before,beforeId||'').all();
 const messages=rows.results.slice(0,50).reverse();return response({code:peer.code,messages,hasOlder:rows.results.length>50});
 }catch{return response({error:'La messagerie est momentanément indisponible.'},503);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Origine refusée.'},403);
 const player=identity(req);if(!player)return response({error:'Ouvrez Mes amis pour activer votre messagerie.'},401);
 const body=await req.json() as {action?:string;code?:string;text?:string;requestId?:string;ids?:string[]},db=env.DB!,peer=await target(db,player,friendCode(body.code));
 if(!peer)return response({error:'Cette conversation n’est pas disponible. Vérifiez votre liste d’amis.'},403);
 if(body.action==='read'){
  if(!Array.isArray(body.ids)||body.ids.length>100||body.ids.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))return response({error:'Messages invalides.'},400);
  if(body.ids.length)await db.prepare(`UPDATE direct_messages SET read_at=? WHERE recipient=? AND sender=? AND read_at IS NULL AND id IN (${body.ids.map(()=>'?').join(',')}) AND ${permission}`).bind(Date.now(),player,peer.player,...body.ids,...pair(player,peer.player)).run();
  return response({read:true});
 }
 if(body.action!=='send'||typeof body.text!=='string'||!body.text.trim()||body.text.trim().length>1000||typeof body.requestId!=='string'||!/^[a-f0-9-]{36}$/.test(body.requestId))return response({error:'Un message doit contenir de 1 à 1 000 caractères.'},400);
 const text=body.text.trim(),existing=await db.prepare('SELECT sender,recipient,text FROM direct_messages WHERE id=?').bind(body.requestId).first<{sender:string;recipient:string;text:string}>();
 if(existing)return existing.sender===player&&existing.recipient===peer.player&&existing.text===text?response({sent:true,id:body.requestId}):response({error:'Cet envoi ne correspond pas au message initial.'},409);
 const result=await db.prepare(`INSERT OR IGNORE INTO direct_messages(id,sender,recipient,text,created_at,read_at) SELECT ?,?,?,?,?,NULL WHERE ${permission} AND (SELECT count(*) FROM direct_messages WHERE sender=? AND created_at>?)<20`).bind(body.requestId,player,peer.player,text,Date.now(),...pair(player,peer.player),player,Date.now()-60000).run();
 if(!result.meta.changes){const saved=await db.prepare('SELECT sender,recipient,text FROM direct_messages WHERE id=?').bind(body.requestId).first<{sender:string;recipient:string;text:string}>();if(saved&&saved.sender===player&&saved.recipient===peer.player&&saved.text===text)return response({sent:true,id:body.requestId});return response({error:'Envoi impossible pour le moment. Vérifiez la relation ou patientez un instant.'},429);}
 return response({sent:true,id:body.requestId});
 }catch{return response({error:'Message non envoyé. Réessayez sans effacer votre texte.'},503);}}
