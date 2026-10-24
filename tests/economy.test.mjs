import ts from 'typescript';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {economyURI,cosmeticsURI,calendarURI,dailyBankURI} from './economy-modules.mjs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText,uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const {wallet,settleDailyStatement,allowedCosmetic,ownedAppearance,roomPrizeStatement,purchaseStatement}=await import(economyURI);
const {COSMETICS,HALLOWEEN,availableItem,eventRemaining,isSeasonal}=await import(cosmeticsURI),{DAILY_QUESTIONS}=await import(dailyBankURI);
const sql=new DatabaseSync(':memory:');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+file,'utf8'));
const db={async batch(list){sql.exec('BEGIN');try{const out=[];for(const s of list)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}},prepare(q){let values=[];return{bind(...v){values=v;return this;},async first(){return sql.prepare(q).get(...values)||null;},async all(){return{results:sql.prepare(q).all(...values)};},async run(){const r=sql.prepare(q).run(...values);return{meta:{changes:Number(r.changes)}};}}}};
globalThis.economyTestDB=db;
let source=readFileSync('app/api/economy/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env={DB:globalThis.economyTestDB};').replace("'../../../lib/economy'",JSON.stringify(economyURI)).replace("'../../../lib/cosmetics'",JSON.stringify(cosmeticsURI)).replace("'../../../lib/daily'",JSON.stringify(calendarURI));
const api=await import(uri(compile(source)));
let now=Date.parse('2026-10-23T19:00:00Z');Date.now=()=>now;
const players=Array.from({length:6},()=>crypto.randomUUID());
for(const [i,p] of players.entries())sql.prepare('INSERT INTO daily_players(id,day,player,name,avatar,state,tries,solved_at) VALUES(?,?,?,?,?,?,?,?)').run('2026-10-23:'+p,'2026-10-23',p,'Player '+i,'{}','{}',i===5?0:i===2?2:1,i<4?now+i:null);
await settleDailyStatement(db,'2026-10-23').run();assert.equal((await wallet(db,players[0])).daily,0,'No provisional podium rewards');
await settleDailyStatement(db,'2026-10-24').run();await settleDailyStatement(db,'2026-10-24').run();
assert.deepEqual(await Promise.all(players.map(async p=>(await wallet(db,p)).daily)),[5,3,1,2,1,0],'Fewest tries, time, participation only after an actual guess');
const p=players[0],cookie='sv_player='+p;
const req=(method='GET',body,origin='https://test.local')=>new Request('https://test.local/api/economy',{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
assert.equal(await allowedCosmetic(db,p,1),undefined);
assert.equal((await api.POST(req('POST',{item:1}))).status,409,'Daily currency cannot buy room items');
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('test-room-credit',p,'room',3,null,now);
const same=await Promise.all([api.POST(req('POST',{item:1})),api.POST(req('POST',{item:1}))]);assert.ok(same.every(r=>r.status===200));assert.equal((await wallet(db,p)).room,1);assert.equal(await allowedCosmetic(db,p,1),1);
assert.equal((await api.POST(req('POST',{item:2}))).status,409);
assert.equal((await api.POST(req('POST',{item:17,price:0,currency:'room'}))).status,200);assert.equal((await wallet(db,p)).daily,2,'Price and currency are server authoritative');
assert.equal((await api.POST(req('POST',{item:999}))).status,400);assert.equal((await api.POST(req('POST',{item:2},'https://evil.test'))).status,403);
assert.deepEqual((await wallet(db,p)).owned.sort((a,b)=>a-b),[1,17]);
// Concurrent distinct purchases can spend only the remaining balance once.
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('test-more-room',p,'room',4,null,now);
const distinct=await Promise.all([api.POST(req('POST',{item:2})),api.POST(req('POST',{item:3}))]);assert.deepEqual(distinct.map(r=>r.status).sort(),[200,409]);assert.equal((await wallet(db,p)).room,2);
// A stale room CAS must never reward an answer; retrying a committed round cannot re-award.
sql.prepare('INSERT INTO rooms VALUES(?,?,?)').run('cinema',JSON.stringify({telemetryCommit:'accepted'}),4);
await roomPrizeStatement(db,p,'cinema','game',1,3,'rejected').run();assert.equal((await wallet(db,p)).room,2);
await roomPrizeStatement(db,p,'cinema','game',1,4,'accepted').run();await roomPrizeStatement(db,p,'cinema','game',1,4,'accepted').run();assert.equal((await wallet(db,p)).room,3);
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('costume-credit',p,'room',80,null,now);assert.equal((await api.POST(req('POST',{item:25}))).status,200);assert.equal(await allowedCosmetic(db,p,25),25,'New costumes use the same server-side ownership checks');
assert.equal(COSMETICS.length,49);assert.equal(new Set(COSMETICS.map(c=>c.id)).size,49);assert.equal(DAILY_QUESTIONS.length,48);assert.equal(new Set(DAILY_QUESTIONS.map(q=>q.answer)).size,48);assert.ok(DAILY_QUESTIONS.every(q=>q.answer.split(' ').length>=3&&q.hint&&q.dailyHint));
console.log('Passed economy: final daily podium 5/3/2, actual attempt participation, no early or duplicate rewards, atomic concurrent purchases, no overdraft, distinct currencies, ownership, authoritative prices, CAS guarded room credits, origin checks and dedicated 48-puzzle bank.');

const owned=await ownedAppearance(db,p,{shape:2,hair:5,eyes:0,nose:1,mouth:0,accessory:1,outfit:0,color:'#f8d779',headwear:1,costume:25,adornment:15,premiumHair:33,premiumEyes:36});assert.equal(owned.headwear,1);assert.equal(owned.costume,25);assert.equal(owned.adornment,undefined);assert.equal(owned.premiumHair,undefined);assert.equal(owned.premiumEyes,undefined);assert.equal(owned.hair,5);assert.equal(owned.accessory,1);assert.ok(COSMETICS.filter(c=>c.id>=25&&c.id<=32).every(c=>c.price>=(c.currency==='room'?80:40)));

// The deadline is an exact Paris midnight boundary, enforced by both API and purchase SQL.
now=HALLOWEEN.endsAt-1;assert.equal(availableItem(39),true);assert.equal(eventRemaining(now),1);assert.equal(isSeasonal(49),true);assert.equal(isSeasonal(25),false);
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('season-credit',p,'room',1000,null,now);
assert.equal((await api.POST(req('POST',{item:39}))).status,200);
now=HALLOWEEN.endsAt;assert.equal(availableItem(39),false);assert.equal(eventRemaining(now),0);assert.equal(new Date(now).toISOString(),'2026-11-09T23:00:00.000Z');
assert.equal((await api.POST(req('POST',{item:40}))).status,410,'Expired event purchase blocked server-side');
assert.equal((await api.POST(req('POST',{item:39}))).status,200,'Previously owned seasonal purchases remain idempotent');
assert.equal((await purchaseStatement(db,p,COSMETICS.find(c=>c.id===48)).run()).meta.changes,0,'SQL also blocks expired purchases');
assert.equal((await ownedAppearance(db,p,{shape:0,hair:1,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779',costume:39})).costume,39,'Owned event costume still equipable after expiry');
assert.equal((await api.POST(req('POST',{item:3}))).status,200,'Permanent stock remains buyable');
console.log('Passed Halloween expiry: Paris midnight, no late purchase, permanent stock available and prior purchases retained.');

const eventItems=COSMETICS.filter(c=>isSeasonal(c.id));
assert.equal(eventItems.filter(c=>c.currency==='daily').reduce((n,c)=>n+c.price,0),16,'Entire daily collection attainable with sixteen ordinary daily participations');
assert.equal(eventItems.filter(c=>c.currency==='room').reduce((n,c)=>n+c.price,0),58,'Room collection attainable in fifty-eight first-place rounds');
assert.deepEqual(eventItems.filter(c=>c.kind==='costume').map(c=>c.price),[18,24,8]);
// Reprice previous purchases using the actual ledger charge, with no duplicate credits.
const early=players[5];
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('early-credit-room',early,'room',160,null,now);
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('early-credit-daily',early,'daily',100,null,now);
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('purchase:'+early+':39',early,'room',-160,39,now);
sql.prepare('INSERT INTO economy_ledger VALUES(?,?,?,?,?,?)').run('purchase:'+early+':41',early,'daily',-75,41,now);
const adjusted=await wallet(db,early);assert.equal(adjusted.room,142);assert.equal(adjusted.daily,92);assert.deepEqual(adjusted.owned.sort((a,b)=>a-b),[39,41]);assert.deepEqual(await wallet(db,early),adjusted,'Reopening the shop never refunds twice');
now=HALLOWEEN.endsAt-1000;
const earlyBuy=await api.POST(new Request('https://test.local/api/economy',{method:'POST',headers:{Cookie:'sv_player='+early,Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({item:40})}));assert.equal(earlyBuy.status,200);assert.equal((await wallet(db,early)).room,118);
assert.equal(sql.prepare('SELECT count(*) AS n FROM economy_ledger WHERE player=? AND id LIKE ?').get(early,'price-adjustment:%').n,2,'Exactly one credit per old purchase, none for purchases at the new price');
console.log('Passed seasonal balance: reachable budgets, actual price-difference refunds, no duplicate credit, original ownership preserved.');
