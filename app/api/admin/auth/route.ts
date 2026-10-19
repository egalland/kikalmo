import {env} from 'cloudflare:workers';
import {adminCookie,isAdmin,issueSession,privateHeaders,sameOrigin} from '../../../../lib/admin-auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){return Response.json({authenticated:await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET)},{headers:privateHeaders});}
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origine refusée.'},{status:403,headers:privateHeaders});
 try{
 if(!env.KIKALMO_ADMIN_SESSION_SECRET||!env.KIKALMO_ADMIN_PASSWORD||env.KIKALMO_ADMIN_PASSWORD.length<16)return Response.json({error:'L’accès administration doit être configuré avec un mot de passe robuste.'},{status:503,headers:privateHeaders});
 const now=Date.now(),window=Math.floor(now/900000);const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.KIKALMO_ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode((req.headers.get('cf-connecting-ip')||'unknown')+'|'+window));const id=Array.from(new Uint8Array(signature),v=>v.toString(16).padStart(2,'0')).join('');
 await env.DB!.prepare('DELETE FROM admin_login_limits WHERE expires_at<?').bind(now).run();
 const count=await env.DB!.prepare('INSERT INTO admin_login_limits(id,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(id,(window+1)*900000).first<{attempts:number}>();
 if(!count||count.attempts>5)return Response.json({error:'Trop de tentatives. Réessaie dans 15 minutes.'},{status:429,headers:{...privateHeaders,'Retry-After':'900'}});
 const b=await req.json() as {username?:string;password?:string};if(b.username!=='admin'||b.password!==env.KIKALMO_ADMIN_PASSWORD)return Response.json({error:'Identifiant ou mot de passe incorrect.'},{status:401,headers:privateHeaders});
 return Response.json({authenticated:true},{headers:{...privateHeaders,'Set-Cookie':adminCookie(await issueSession(env.KIKALMO_ADMIN_SESSION_SECRET))}});
 }catch{return Response.json({error:'Connexion indisponible. Réessaie.'},{status:503,headers:privateHeaders});}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});return Response.json({authenticated:false},{headers:{...privateHeaders,'Set-Cookie':adminCookie('',0)}});}
