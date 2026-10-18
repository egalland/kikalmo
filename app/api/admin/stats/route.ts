import {env} from 'cloudflare:workers';
import {isAdmin,privateHeaders} from '../../../../lib/admin-auth';
import {period,readStats} from '../../../../lib/stats';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 if(!await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET))return Response.json({error:'Connecte-toi pour consulter les statistiques.'},{status:401,headers:privateHeaders});
 let range;try{range=period(new URL(req.url));}catch(e){return Response.json({error:(e as Error).message},{status:400,headers:privateHeaders});}
 try{return Response.json(await readStats(env.DB!,range.from,range.to),{headers:privateHeaders});}catch{return Response.json({error:'Les statistiques sont momentanément indisponibles. Réessaie.'},{status:503,headers:privateHeaders});}
}
