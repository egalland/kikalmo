import {env} from 'cloudflare:workers';
import {accountSession,resolvePlayer,sessionToken,accountCookie} from '../../../lib/account-identity';
import {playerHash} from '../../../lib/analytics';
import {parseProfile,type Profile} from '../../../lib/profile';
import {ownedAppearance} from '../../../lib/economy';
import {sameOrigin,privateHeaders} from '../../../lib/admin-auth';
export const dynamic='force-dynamic';
const validKey=(key:unknown):key is string=>typeof key==='string'&&/^KK1_[a-zA-Z0-9_-]{43}$/.test(key);
const guestCookie=(token:string)=>`sv_player=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
const keyCookie=(key:string)=>`kk_account_key=${key}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=34128000`;
const cookie=(req:Request,name:string)=>req.headers.get('cookie')?.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'))?.[1];
const expire=(name:string)=>`${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
const makeKey=()=>'KK1_'+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function response(body:unknown,status=200,cookies:string[]=[]){const headers=new Headers(privateHeaders);for(const c of cookies)headers.append('Set-Cookie',c);return Response.json(body,{status,headers});}
async function snapshot(req:Request){const a=await accountSession(env.DB!,req);if(!a)return {connected:false,profile:null,revision:0,devices:0,hasKey:false};const key=(cookie(req,'kk_account_key')||cookie(req,'kk_stats'));return {connected:true,profile:parseProfile(a.profile),revision:a.revision,devices:(await env.DB!.prepare('SELECT count(*) AS n FROM account_sessions WHERE player=? AND expires_at>?').bind(a.player,Date.now()).first<{n:number}>())?.n||1,hasKey:validKey(key)&&await playerHash('stats-key:'+key)===a.key_hash};}
async function cleanProfile(raw:unknown,player:string):Promise<Profile|null>{const p=parseProfile(JSON.stringify(raw));if(!p)return null;return {...p,avatar:await ownedAppearance(env.DB!,player,p.avatar)};}
export async function GET(req:Request){try{return response(await snapshot(req),200,sessionToken(req)?[]:[guestCookie(crypto.randomUUID())]);}catch{return response({error:'Le compte est momentanément indisponible.'},503);}}
export async function POST(req:Request){if(!sameOrigin(req))return response({error:'Origine refusée.'},403);try{
 if(Number(req.headers.get('content-length')||0)>16000)return response({error:'Demande trop volumineuse.'},413);
 const raw=await req.text();if(raw.length>16000)return response({error:'Demande trop volumineuse.'},413);
 const b=JSON.parse(raw) as {action:string;key?:string;profile?:unknown;revision?:number};const db=env.DB!,current=await accountSession(db,req),now=Date.now(),token=sessionToken(req);
 if(b.action==='import'){
  const key=typeof b.key==='string'?b.key.trim():undefined;if(!validKey(key))return response({error:'Clé Kikalmo invalide.'},400);
  const hash=await playerHash('stats-key:'+key),target=await db.prepare('SELECT player FROM player_accounts WHERE key_hash=?').bind(hash).first<{player:string}>();
  if(!target)return response({error:'Cette clé n’ouvre pas encore de compte joueur. Si elle servait aux statistiques, liez-la au compte depuis l’appareil qui possède votre personnage et vos achats.'},400);
  if(current?.player===target.player)return response({...await snapshot(req),hasKey:true,key},200,[keyCookie(key)]);
  const guest=!current?await resolvePlayer(db,req):undefined,newToken=crypto.randomUUID();
  const added=await db.prepare('INSERT INTO account_sessions(token,player,created_at,expires_at) SELECT ?,player,?,? FROM player_accounts WHERE player=? AND key_hash=? AND (SELECT count(*) FROM account_sessions WHERE player=? AND expires_at>?)<100').bind(newToken,now,now+395*86400000,target.player,hash,target.player,now).run();
  if(!added.meta.changes)return response({error:'Clé renouvelée ou limite de 100 appareils atteinte. Vérifiez la clé ou renouvelez-la depuis un appareil connecté.'},409);
  const headers=[accountCookie(newToken),keyCookie(key)];if(guest)headers.push(`kk_guest=${guest}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000`);
  const next=new Request(req.url,{headers:{cookie:'sv_player='+newToken+'; kk_account_key='+key}});return response({...await snapshot(next),key},200,headers);
 }
 if(b.action==='create'){
  if(current)return response(await snapshot(req));
  const player=await resolvePlayer(db,req)||crypto.randomUUID(),profile=await cleanProfile(b.profile,player);if(!profile)return response({error:'Créez votre personnage avant de lier votre compte.'},400);
  const supplied=typeof b.key==='string'?b.key.trim():undefined;let key=supplied||(cookie(req,'kk_account_key')||cookie(req,'kk_stats')),vault:string|undefined;
  if(b.key!==undefined&&!validKey(supplied))return response({error:'Ancienne clé invalide.'},400);
  if(validKey(key)){const hash=await playerHash('stats-key:'+key);const legacy=await db.prepare('SELECT id FROM personal_stat_keys WHERE id=? AND last_seen>=?').bind(hash,now-395*86400000).first<{id:string}>();if(legacy)vault=legacy.id;else if(b.key)return response({error:'Cette ancienne clé de statistiques est invalide ou expirée.'},400);else key=undefined;}
  if(!validKey(key))key=makeKey();const hash=await playerHash('stats-key:'+key);
  const link=await db.prepare('SELECT vault FROM player_stat_links WHERE player=?').bind(await playerHash(player)).first<{vault:string}>();vault=vault||link?.vault||hash;
  const existing=await db.prepare('SELECT player FROM player_accounts WHERE key_hash=?').bind(hash).first<{player:string}>();if(existing&&existing.player!==player)return response({error:'Cette clé est déjà liée à un compte. Utilisez Récupérer mon compte.'},409);
  const browser=token&&await resolvePlayer(db,req)?token:player;
  await db.batch([
   db.prepare('INSERT OR IGNORE INTO player_accounts(player,key_hash,vault,profile,created_at) VALUES(?,?,?,?,?)').bind(player,hash,vault,JSON.stringify(profile),now),
   db.prepare('INSERT OR IGNORE INTO personal_stat_keys(id,created_at,last_seen) VALUES(?,?,?)').bind(vault,now,now),
   db.prepare('INSERT OR IGNORE INTO player_stat_links(player,vault,linked_at) VALUES(?,?,?)').bind(await playerHash(player),vault,now),
   db.prepare('INSERT OR IGNORE INTO account_sessions(token,player,created_at,expires_at) SELECT ?,player,?,? FROM player_accounts WHERE player=? AND key_hash=?').bind(browser,now,now+395*86400000,player,hash),
  ]);
  const next=new Request(req.url,{headers:{cookie:'sv_player='+browser+'; kk_account_key='+key}});const state=await snapshot(next);if(!state.connected||!state.hasKey)return response({error:'Association concurrente. Rechargez le compte puis réessayez.'},409);
  return response({...state,key},200,[accountCookie(browser),keyCookie(key)]);
 }
 if(!current)return response({error:'Connectez votre compte avec sa clé.'},401);
 if(b.action==='profile'){
  const profile=await cleanProfile(b.profile,current.player);if(!profile||!Number.isInteger(b.revision))return response({error:'Personnage ou version invalide.'},400);
  const saved=await db.prepare('UPDATE player_accounts SET profile=?,revision=revision+1 WHERE player=? AND revision=?').bind(JSON.stringify(profile),current.player,b.revision).run();
  if(!saved.meta.changes)return response({error:'Votre personnage a été modifié sur un autre appareil. Rechargez-le avant d’enregistrer.',...await snapshot(req)},409);
  await db.prepare('UPDATE friend_profiles SET name=?,avatar=? WHERE player=?').bind(profile.name,JSON.stringify(profile.avatar),current.player).run();
  return response(await snapshot(req));
 }
 if(b.action==='export'){
  const key=(cookie(req,'kk_account_key')||cookie(req,'kk_stats'));if(!validKey(key)||await playerHash('stats-key:'+key)!==current.key_hash)return response({error:'La clé n’est plus disponible ici. Renouvelez-la depuis ce compte connecté.'},409);
  return response({key});
 }
 if(b.action==='rotate'){
  const key=makeKey(),hash=await playerHash('stats-key:'+key);const updated=await db.prepare('UPDATE player_accounts SET key_hash=? WHERE player=? AND key_hash=?').bind(hash,current.player,current.key_hash).run();
  if(!updated.meta.changes)return response({error:'La clé vient de changer sur un autre appareil. Rechargez le compte.'},409);
  await db.batch([db.prepare('DELETE FROM account_sessions WHERE player=? AND token<>?').bind(current.player,token),db.prepare('DELETE FROM personal_stat_keys WHERE id=? OR id=?').bind(current.key_hash,current.vault)]);
  return response({...await snapshot(req),hasKey:true,key},200,[keyCookie(key)]);
 }
 if(b.action==='logout'){
  await db.prepare('DELETE FROM account_sessions WHERE token=?').bind(token).run();
  const guest=cookie(req,'kk_guest'),restore=guest&&/^[a-f0-9-]{36}$/.test(guest)&&!await db.prepare('SELECT player FROM player_accounts WHERE player=?').bind(guest).first()?guest:crypto.randomUUID();
  return response({connected:false,restoredGuest:!!guest&&restore===guest},200,[guestCookie(restore),expire('kk_guest'),expire('kk_stats'),expire('kk_account_key')]);
 }
 return response({error:'Action inconnue.'},400);
 }catch{return response({error:'L’opération n’a pas pu être terminée. Réessayez.'},503);}}
