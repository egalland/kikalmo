import {env} from 'cloudflare:workers';
import {isAdmin,privateHeaders,sameOrigin} from '../../../../lib/admin-auth';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:privateHeaders});
export async function GET(req:Request){if(!await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET))return reply({error:'Connexion requise.'},401);try{
 const rows=await env.DB!.prepare('SELECT id,kind,room,reason,detail,context,created_at,status FROM player_reports WHERE created_at>=? ORDER BY created_at DESC LIMIT 200').bind(Date.now()-90*86400000).all();return reply({reports:rows.results});
 }catch{return reply({error:'Signalements indisponibles.'},503);}}
export async function POST(req:Request){if(!sameOrigin(req)||!await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET))return reply({error:'Accès refusé.'},403);try{const b=await req.json() as {id?:string;status?:string};if(typeof b.id!=='string'||!/^[a-f0-9]{64}$/.test(b.id)||!['open','reviewed'].includes(b.status||''))return reply({error:'Choix invalide.'},400);await env.DB!.prepare('UPDATE player_reports SET status=? WHERE id=?').bind(b.status,b.id).run();return reply({saved:true});}catch{return reply({error:'Mise à jour impossible.'},503);}}
