import ts from 'typescript';import {readFileSync,readdirSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText,uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const codes=uri(compile(readFileSync('lib/friends.ts','utf8').split('\n').find(s=>s.startsWith('export function friendCode'))));
const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));
const db={prepare(q){let values=[];return{bind(...v){values=v;return this;},async first(){return sql.prepare(q).get(...values)||null;},async all(){return{results:sql.prepare(q).all(...values)};},async run(){const r=sql.prepare(q).run(...values);return{meta:{changes:Number(r.changes)}};}}}};
globalThis.messageDB=db;const source=readFileSync('app/api/messages/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env={DB:globalThis.messageDB};').replace("'../../../lib/friends'",JSON.stringify(codes));const api=await import(uri(compile(source)));
const oldNow=Date.now;let now=Date.parse('2026-10-24T18:00:00Z');Date.now=()=>now;
const people=Array.from({length:4},(_,i)=>({id:crypto.randomUUID(),code:String(i+1).repeat(16),name:'Player '+i}));const [a,b,c,d]=people;
for(const p of people)sql.prepare('INSERT INTO friend_profiles(player,code,name,avatar,seen) VALUES(?,?,?,?,?)').run(p.id,p.code,p.name,'{}',now);
sql.prepare("INSERT INTO friend_links VALUES(?,?,'accepted',?)").run(a.id,b.id,now);sql.prepare("INSERT INTO friend_links VALUES(?,?,'pending',?)").run(a.id,c.id,now);
async function call(who,body,query='',origin='https://test.local'){
 const req=new Request('https://test.local/api/messages'+query,{method:body?'POST':'GET',headers:{Cookie:who?'sv_player='+who.id:'',Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const response=await(body?api.POST(req):api.GET(req));return{status:response.status,data:await response.json()};
}
const send=(who,peer,text='Salut',id=crypto.randomUUID())=>call(who,{action:'send',code:peer.code,text,requestId:id});
try{
 assert.equal((await call(null)).data.conversations.length,0);assert.equal((await send(null,b)).status,401);assert.equal((await send(c,b)).status,403);assert.equal((await send(a,c)).status,403,'Pending is not a friendship');assert.equal((await call(c,null,'?code='+b.code)).status,403);
 assert.equal((await call(a,{action:'send',code:b.code,text:'x',requestId:crypto.randomUUID()},'','https://evil.local')).status,403);
 assert.equal((await send(a,b,' '.repeat(3))).status,400);assert.equal((await send(a,b,'x'.repeat(1001))).status,400);
 const id=crypto.randomUUID(),results=await Promise.all([send(a,b,'Bonjour <script> !',id),send(a,b,'Bonjour <script> !',id),send(a,b,'Bonjour <script> !',id)]);assert.ok(results.every(r=>r.status===200));assert.equal(sql.prepare('SELECT count(*) n FROM direct_messages').get().n,1);assert.equal((await send(a,b,'Changed',id)).status,409);
 let view=(await call(b,null,'?code='+a.code)).data;assert.equal(view.messages[0].fromMe,'peer');assert.equal(view.messages[0].text,'Bonjour <script> !');assert.ok(!JSON.stringify(view).includes(a.id));assert.ok(!JSON.stringify(view).includes(b.id));assert.equal((await call(a,null,'?code='+b.code)).data.messages[0].fromMe,'me');
 assert.equal((await call(b)).data.conversations[0].unread,1);assert.equal((await call(c)).data.conversations.length,0);
 assert.equal((await call(c,{action:'read',code:a.code,ids:[id]})).status,403);await call(a,{action:'read',code:b.code,ids:[id]});assert.equal((await call(b)).data.conversations[0].unread,1,'Sender cannot mark recipient inbox as read');
 await call(b,{action:'read',code:a.code,ids:[id]});assert.equal((await call(b)).data.conversations[0].unread,0);assert.equal((await call(a,null,'?code='+b.code)).data.messages[0].readAt,now);
 await send(b,a,'Réponse');assert.equal((await call(a)).data.conversations[0].unread,1);
 sql.prepare('INSERT INTO friend_blocks VALUES(?,?)').run(b.id,a.id);
 assert.equal((await send(a,b)).status,403);assert.equal((await send(b,a)).status,403);assert.equal((await call(a,null,'?code='+b.code)).status,403);assert.equal((await call(b,null,'?code='+a.code)).status,403);assert.equal((await call(a)).data.conversations.length,0);
 sql.prepare('DELETE FROM friend_links WHERE requester=? AND recipient=?').run(a.id,b.id);sql.prepare('DELETE FROM friend_blocks').run();assert.equal((await send(a,b)).status,403,'Unblocking does not recreate friendship');sql.prepare("INSERT INTO friend_links VALUES(?,?,'accepted',?)").run(a.id,b.id,now);
 // Simulate a block between the permission read and the write: the INSERT must recheck permission.
 const originalPrepare=db.prepare;let blockedOnWrite=false;db.prepare=function(q){if(!blockedOnWrite&&q.startsWith('INSERT OR IGNORE INTO direct_messages')){blockedOnWrite=true;sql.prepare('INSERT INTO friend_blocks VALUES(?,?)').run(b.id,a.id);}return originalPrepare(q)};
 assert.equal((await send(a,b,'Race')).status,429);assert.equal(sql.prepare("SELECT count(*) n FROM direct_messages WHERE text='Race'").get().n,0);db.prepare=originalPrepare;sql.prepare('DELETE FROM friend_blocks').run();
 // Cursor pagination is stable even when many messages have an identical timestamp.
 const insert=sql.prepare('INSERT INTO direct_messages VALUES(?,?,?,?,?,NULL)');for(let i=0;i<115;i++)insert.run(crypto.randomUUID(),a.id,b.id,'History '+i,now-10000);
 view=(await call(b,null,'?code='+a.code)).data;assert.equal(view.messages.length,50);assert.equal(view.hasOlder,true);const seen=new Set(view.messages.map(m=>m.id));let first=view.messages[0];
 for(let i=0;i<2;i++){const page=(await call(b,null,'?code='+a.code+'&before='+first.at+'&beforeId='+first.id)).data;for(const m of page.messages){assert.ok(!seen.has(m.id));seen.add(m.id)}first=page.messages[0];if(i===1)assert.equal(page.hasOlder,false)}assert.equal(seen.size,117);
 insert.run(crypto.randomUUID(),a.id,b.id,'expired',now-91*86400000);assert.ok(!(await call(a,null,'?code='+b.code)).data.messages.some(m=>m.text==='expired'));
 // Twenty fresh sends per minute are checked in the atomic insert; retries do not consume another slot.
 now+=61000;const burst=await Promise.all(Array.from({length:21},(_,i)=>send(a,b,'Burst '+i)));assert.equal(burst.filter(r=>r.status===200).length,20);assert.equal(burst.filter(r=>r.status===429).length,1);
 console.log('Passed private messages: accepted friends only, read/unread isolation, retry idempotence, blocking in both directions including a write race, reconnect history, stable pagination, retention window, rate limit and no leaked session identities.');
}finally{Date.now=oldNow;delete globalThis.messageDB}
