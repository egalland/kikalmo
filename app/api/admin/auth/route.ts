import {env} from 'cloudflare:workers';
import {adminCookie,isAdmin,issueSession,privateHeaders,sameOrigin} from '../../../../lib/admin-auth';
export const dynamic='force-dynamic';
export async function GET(req:Request){return Response.json({authenticated:await isAdmin(req,env.KIKALMO_ADMIN_SESSION_SECRET)},{headers:privateHeaders});}
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'Origine refusée.'},{status:403,headers:privateHeaders});
 try{const b=await req.json() as {username?:string;password?:string};if(b.username!=='admin'||b.password!==env.KIKALMO_ADMIN_PASSWORD)return Response.json({error:'Identifiant ou mot de passe incorrect.'},{status:401,headers:privateHeaders});
 if(!env.KIKALMO_ADMIN_SESSION_SECRET||!env.KIKALMO_ADMIN_PASSWORD)throw Error('config');
 return Response.json({authenticated:true},{headers:{...privateHeaders,'Set-Cookie':adminCookie(await issueSession(env.KIKALMO_ADMIN_SESSION_SECRET))}});
 }catch{return Response.json({error:'Connexion indisponible. Réessaie.'},{status:503,headers:privateHeaders});}
}
export async function DELETE(req:Request){if(!sameOrigin(req))return new Response(null,{status:403});return Response.json({authenticated:false},{headers:{...privateHeaders,'Set-Cookie':adminCookie('',0)}});}
