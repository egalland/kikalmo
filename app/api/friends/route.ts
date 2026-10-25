import {resolvePlayer,accountSession} from '../../../lib/account-identity';
import {env} from 'cloudflare:workers';
import {cleanAvatar} from '../../../lib/profile';
import {ownedAppearance} from '../../../lib/economy';
import {friendCode,friendsSnapshot} from '../../../lib/friends';
export const dynamic='force-dynamic';
const identity=(req:Request)=>resolvePlayer(env.DB!,req);
function response(data:unknown,status=200,player?:string){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...(player?{'Set-Cookie':`sv_player=${player}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`}:{})}});}
export async function GET(req:Request){try{return response(await friendsSnapshot(env.DB!,await identity(req)));}catch{return response({error:'Le panneau d’amis est momentanément indisponible.'},503);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Origine refusée.'},403);
 const b=await req.json() as {action:string;code?:string;name?:string;avatar?:unknown;visible?:boolean;room?:string;target?:string};let player=await identity(req);const db=env.DB!;
 if(b.action==='register'||b.action==='pulse'){
  const stored=await accountSession(db,req);if(stored){const p=JSON.parse(stored.profile);b.name=p.name;b.avatar=p.avatar;}
  if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>20)return response({error:'Créez votre personnage pour utiliser les amis.'},400);
  if(b.action==='pulse'&&!player)return response({error:'Ouvrez d’abord le panneau d’amis.'},401);player??=crypto.randomUUID();
  const exists=await db.prepare('SELECT code FROM friend_profiles WHERE player=?').bind(player).first();
  if(!exists&&b.action==='pulse')return response({error:'Ouvrez d’abord le panneau d’amis.'},409);
  const avatar=await ownedAppearance(db,player,cleanAvatar(b.avatar));
  await db.prepare('INSERT INTO friend_profiles(player,code,name,avatar,seen) VALUES(?,?,?,?,?) ON CONFLICT(player) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,seen=excluded.seen').bind(player,crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),b.name.trim(),JSON.stringify(avatar),Date.now()).run();
  return response(await friendsSnapshot(db,player),200,stored?undefined:player);
 }
 if(!player||!await db.prepare('SELECT code FROM friend_profiles WHERE player=?').bind(player).first())return response({error:'Ouvrez d’abord le panneau d’amis.'},401);
 if(b.action==='visibility'){if(typeof b.visible!=='boolean')return response({error:'Choix invalide.'},400);await db.prepare('UPDATE friend_profiles SET visible=? WHERE player=?').bind(b.visible?1:0,player).run();return response(await friendsSnapshot(db,player));}
 if(!['request','request-room','block-room','accept','decline','cancel','remove','block','unblock','locate'].includes(b.action))return response({error:'Action inconnue.'},400);
 let roomTarget:string|undefined;
 if(b.action==='request-room'||b.action==='block-room'){
  const blocking=b.action==='block-room';
  if(typeof b.room!=='string'||typeof b.target!=='string'||!/^[a-f0-9]{8}$/.test(b.target))return response({error:'Joueur du salon invalide.'},400);
  const row=await db.prepare('SELECT state FROM rooms WHERE id=?').bind(b.room).first<{state:string}>();
  const participants=(row?JSON.parse(row.state).players||[]:[]).filter((p:{seen:number})=>Date.now()-p.seen<12000);
  if(!participants.some((p:{id:string})=>p.id===player))return response({error:'Rejoignez ce salon pour ajouter un joueur.'},403);
  const peers=participants.filter((p:{id:string})=>p.id.slice(0,8)===b.target&&p.id!==player);
  if(peers.length!==1)return response({error:'Ce joueur n’est plus disponible dans ce salon.'},409);
  const peer=peers[0];
  if(!blocking&&await db.prepare('SELECT owner FROM friend_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(player,peer.id,peer.id,player).first())return response({error:'Cette relation n’est pas disponible.'},403);
  // A live room already provides this public name/avatar; preserve any existing social preferences.
  await db.prepare('INSERT OR IGNORE INTO friend_profiles(player,code,name,avatar,seen) VALUES(?,?,?,?,?)').bind(peer.id,crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),peer.name,JSON.stringify(cleanAvatar(peer.avatar)),peer.seen).run();
  const contact=await db.prepare('SELECT code FROM friend_profiles WHERE player=?').bind(peer.id).first<{code:string}>();
  b.code=contact!.code;roomTarget=b.target;b.action=blocking?'block':'request';
 }
 const code=friendCode(b.code);if(!/^[A-F0-9]{16}$/.test(code))return response({error:'Entrez un code ami valide.'},400);
 const target=await db.prepare('SELECT player FROM friend_profiles WHERE code=?').bind(code).first<{player:string}>();if(!target)return response({error:'Code ami introuvable.'},404);if(target.player===player)return response({error:'C’est votre propre code ami.'},400);
 const other=target.player;
 if(b.action==='block'){await db.batch([db.prepare('INSERT OR IGNORE INTO friend_blocks(owner,target) VALUES(?,?)').bind(player,other),db.prepare('DELETE FROM friend_links WHERE (requester=? AND recipient=?) OR (requester=? AND recipient=?)').bind(player,other,other,player)]);return response(await friendsSnapshot(db,player));}
 if(b.action==='unblock'){await db.prepare('DELETE FROM friend_blocks WHERE owner=? AND target=?').bind(player,other).run();return response(await friendsSnapshot(db,player));}
 if(await db.prepare('SELECT owner FROM friend_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(player,other,other,player).first())return response({error:'Cette relation n’est pas disponible.'},403);
 if(b.action==='request'){
  const total=await db.prepare('SELECT count(*) AS n FROM friend_links WHERE requester=? OR recipient=?').bind(player,player).first<{n:number}>();if((total?.n||0)>=100)return response({error:'Votre liste est pleine. Retirez une demande ou un ami.'},409);
  // One canonical direction per pair, even when both players send a request simultaneously.
  const [first,second]=[player,other].sort();const reverse=await db.prepare('SELECT requester,status FROM friend_links WHERE (requester=? AND recipient=?) OR (requester=? AND recipient=?)').bind(first,second,second,first).first<{requester:string;status:string}>();
  if(!reverse)await db.prepare(`INSERT OR IGNORE INTO friend_links(requester,recipient,status,created_at) SELECT ?,?,'pending',? WHERE NOT EXISTS(SELECT 1 FROM friend_links WHERE requester=? AND recipient=?) AND NOT EXISTS(SELECT 1 FROM friend_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)) AND (SELECT count(*) FROM friend_links WHERE requester=? OR recipient=?)<100`).bind(player,other,Date.now(),other,player,player,other,other,player,player,player).run();
 }else if(b.action==='accept')await db.prepare("UPDATE friend_links SET status='accepted' WHERE requester=? AND recipient=? AND status='pending' AND NOT EXISTS(SELECT 1 FROM friend_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?))").bind(other,player,player,other,other,player).run();
 else if(b.action==='decline')await db.prepare("DELETE FROM friend_links WHERE requester=? AND recipient=? AND status='pending'").bind(other,player).run();
 else if(b.action==='cancel')await db.prepare("DELETE FROM friend_links WHERE requester=? AND recipient=? AND status='pending'").bind(player,other).run();
 else if(b.action==='remove')await db.prepare('DELETE FROM friend_links WHERE (requester=? AND recipient=?) OR (requester=? AND recipient=?)').bind(player,other,other,player).run();
 const snapshot=await friendsSnapshot(db,player);
 if(b.action==='locate'){const friend=snapshot.friends.find(f=>f.code===code);if(!friend?.room)return response({error:'Cet ami n’est plus dans un salon accessible.'},409);const row=await db.prepare('SELECT state FROM rooms WHERE id=?').bind(friend.room).first<{state:string}>();const present=row?JSON.parse(row.state).players||[]:[];if(present.filter((p:{seen:number})=>Date.now()-p.seen<12000).length>=30)return response({error:'Le salon de cet ami est complet. Réessayez dans un instant.'},409);return response({room:friend.room});}
 return response(roomTarget?{...snapshot,roomTarget:{id:roomTarget,code}}:snapshot);
 }catch{return response({error:'La demande n’a pas pu être enregistrée. Réessayez.'},503);}}
