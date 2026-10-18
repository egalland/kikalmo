import {env} from 'cloudflare:workers';
import {isAdmin,privateHeaders} from '../../../../lib/admin-auth';
import {period,readStats} from '../../../../lib/stats';
import {statsPDF} from '../../../../lib/stats-pdf';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 if(!await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET))return Response.json({error:'Connecte-toi pour exporter les statistiques.'},{status:401,headers:privateHeaders});
 let range;try{range=period(new URL(req.url));}catch(e){return Response.json({error:(e as Error).message},{status:400,headers:privateHeaders});}
 try{const data=await readStats(env.DB!,range.from,range.to);const bytes=statsPDF(data);return new Response(bytes,{headers:{...privateHeaders,'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Kikalmo_${range.from==='2000-01-01'?'total':range.from}_${range.to}.pdf"`}});}catch{return Response.json({error:'Le PDF n’a pas pu être généré. Réessaie.'},{status:503,headers:privateHeaders});}
}
