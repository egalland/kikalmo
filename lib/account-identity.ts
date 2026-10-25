/** A browser cookie is a session token; legacy guests keep their existing UUID. */
export const sessionToken=(req:Request)=>req.headers.get('cookie')?.match(/(?:^|;\s*)sv_player=([a-f0-9-]{36})(?:;|$)/)?.[1];
export async function accountSession(db:D1Database,req:Request){
 const token=sessionToken(req);if(!token)return null;
 return await db.prepare('SELECT a.player,a.key_hash,a.vault,a.profile,a.revision FROM account_sessions s JOIN player_accounts a ON a.player=s.player WHERE s.token=? AND s.expires_at>?').bind(token,Date.now()).first<{player:string;key_hash:string;vault:string;profile:string;revision:number}>();
}
export async function resolvePlayer(db:D1Database,req:Request):Promise<string|undefined>{
 const token=sessionToken(req);if(!token)return undefined;
 const session=await accountSession(db,req);if(session)return session.player;
 // Revoked/expired sessions must never fall back to their former guest identity.
 const known=await db.prepare('SELECT token FROM account_sessions WHERE token=? UNION ALL SELECT player AS token FROM player_accounts WHERE player=? LIMIT 1').bind(token,token).first();
 return known?undefined:token;
}
export const accountCookie=(token:string)=>`sv_player=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=34128000`;
