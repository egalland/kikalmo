const COOKIE='kk_admin';
export const adminCookie=(value:string,age=43200)=>`${COOKIE}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${age}`;
const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a),b=>b.toString(16).padStart(2,'0')).join('');
async function signature(value:string,secret:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));}
export function sameOrigin(req:Request){return req.headers.get('origin')===new URL(req.url).origin;}
export async function issueSession(secret:string){const payload=`${Date.now()+43200000}.${crypto.randomUUID()}`;return `${payload}.${await signature(payload,secret)}`;}
export async function isAdmin(req:Request,secret?:string){if(!secret)return false;const value=req.headers.get('cookie')?.match(/(?:^|;\s*)kk_admin=([^;]+)/)?.[1];if(!value)return false;const [expiry,nonce,sig,...rest]=value.split('.');if(rest.length||!/^\d+$/.test(expiry)||Number(expiry)<Date.now()||!nonce||!sig)return false;const expected=await signature(`${expiry}.${nonce}`,secret);if(sig.length!==expected.length)return false;let diff=0;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);return diff===0;}
export const privateHeaders={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
