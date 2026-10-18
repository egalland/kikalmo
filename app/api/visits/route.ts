import {env} from 'cloudflare:workers';
import {calendar,playerHash} from '../../../lib/analytics';
import {sameOrigin} from '../../../lib/admin-auth';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 if(!sameOrigin(req))return new Response(null,{status:403});
 try{let id=req.headers.get('cookie')?.match(/(?:^|;\s*)kk_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];const fresh=!id;if(!id)id=crypto.randomUUID();const at=Date.now(),day=calendar(at).day,visitor=await playerHash('visit:'+id);
 await env.DB!.prepare('INSERT INTO site_visitor_days(id,day,visitor,first_seen,last_seen,views) VALUES (?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen,views=site_visitor_days.views+1').bind(day+'|'+visitor,day,visitor,at,at).run();
 return new Response(null,{status:204,headers:{'Cache-Control':'no-store',...(fresh?{'Set-Cookie':`kk_visitor=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`}:{})}});
 }catch{return new Response(null,{status:503});}
}
