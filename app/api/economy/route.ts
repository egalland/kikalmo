import {env} from 'cloudflare:workers';
import {COSMETICS} from '../../../lib/cosmetics';
import {wallet,settleDailyStatement,purchaseStatement} from '../../../lib/economy';
import {dailyDate} from '../../../lib/daily';
export const dynamic='force-dynamic';
const cookie=(req:Request)=>req.headers.get('cookie')?.match(/(?:^|;\s*)sv_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
function response(data:unknown,status=200,token?:string){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...(token?{'Set-Cookie':`sv_player=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`}:{})}});}
export async function GET(req:Request){try{const old=cookie(req),player=old||crypto.randomUUID();await settleDailyStatement(env.DB!,dailyDate()).run();return response(await wallet(env.DB!,player),200,old?undefined:player);}catch{return response({error:'La boutique est momentanément indisponible.'},503);}}
export async function POST(req:Request){try{if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Origine refusée.'},403);const player=cookie(req);if(!player)return response({error:'Ouvre la boutique avant de faire un achat.'},401);const body=await req.json() as {item?:number};const item=COSMETICS.find(c=>c.id===body.item);if(!item)return response({error:'Cosmétique inconnu.'},400);await settleDailyStatement(env.DB!,dailyDate()).run();const result=await purchaseStatement(env.DB!,player,item).run();const current=await wallet(env.DB!,player);if(!result.meta.changes&&!current.owned.includes(item.id))return response({error:'Pas assez de pièces pour cet achat.',...current},409);return response(current);}catch{return response({error:'L’achat n’a pas pu être enregistré. Réessaie.'},503);}}
