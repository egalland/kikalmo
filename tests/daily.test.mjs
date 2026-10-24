import {economyURI,dailyBankURI,calendarURI} from './economy-modules.mjs';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const profile=uri(compile(readFileSync('lib/profile.ts','utf8')));
const game=uri(compile(readFileSync('lib/game.ts','utf8').replace("import questionBank from './question-bank.json';",'const questionBank='+readFileSync('lib/question-bank.json','utf8')+';').replace("import questionClues from './question-clues.json';",'const questionClues='+readFileSync('lib/question-clues.json','utf8')+';').replace("import clueSources from './question-clue-sources.json';",'const clueSources='+readFileSync('lib/question-clue-sources.json','utf8')+';'))),themes=uri(compile(readFileSync('lib/themes.ts','utf8')));
const analytics=uri(compile(readFileSync('lib/analytics.ts','utf8').replace("'./game'",JSON.stringify(game))));
const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_polite_next_avengers.sql','utf8'));
sql.exec(readFileSync('drizzle/0001_premium_miracleman.sql','utf8'));
sql.exec(readFileSync('drizzle/0002_giant_skrulls.sql','utf8'));
sql.exec(readFileSync('drizzle/0003_natural_polaris.sql','utf8'));
for(const f of ['0007_boring_jack_murdock.sql'])sql.exec(readFileSync('drizzle/'+f,'utf8'));
let batchTail=Promise.resolve();
globalThis.__testDB={batch(statements){const task=batchTail.then(async()=>{sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}});batchTail=task.catch(()=>{});return task;},prepare(query){let values=[];return {bind(...v){values=v;return this},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}}}}}};

const daily=uri(compile(readFileSync('lib/daily.ts','utf8').replace("'./game'",JSON.stringify(game)).replace("import clues from './question-clues.json';",'const clues='+readFileSync('lib/question-clues.json','utf8')+';')));
let source=readFileSync('app/api/daily/route.ts','utf8').replace("'../../../lib/economy'",JSON.stringify(economyURI)).replace("'../../../lib/daily-bank'",JSON.stringify(dailyBankURI)).replace("import {env} from 'cloudflare:workers';",'const env={DB:globalThis.__testDB};').replace("'../../../lib/game'",JSON.stringify(game)).replace("'../../../lib/profile'",JSON.stringify(profile)).replace("'../../../lib/daily'",JSON.stringify(daily)).replace("'../../../lib/analytics'",JSON.stringify(analytics));
const {POST,GET}=await import(uri(compile(source)));
let now=Date.parse('2026-10-17T10:00:00Z');Date.now=()=>now;
const day='2026-10-17';
const q={answer:'Ratatouille',theme:'cinema',wiki:'Ratatouille',hint:'Un chef inattendu à Paris.'};
sql.prepare('INSERT INTO daily_challenges(day,question) VALUES (?,?)').run(day,JSON.stringify(q));
async function get(cookie='',page=1){const r=await GET(new Request('https://test.local/api/daily?page='+page,{headers:{Cookie:cookie}}));return {status:r.status,body:await r.json()};}
async function post(cookie='',extra={}){const r=await POST(new Request('https://test.local/api/daily',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({day,action:'join',name:'Test Muppet',avatar:{shape:3,hair:4},...extra})}));return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};}
const start=await get();assert.equal(start.status,200);assert.equal(start.body.answer,undefined);assert.equal(start.body.theme,'cinema');assert.ok(!JSON.stringify(start.body).includes('Ratatouille'));
const alice=await post('',{name:'Alice'});const bob=await post('',{name:'Bob'});assert.notEqual(alice.cookie,bob.cookie);
for(let i=0;i<9;i++){const request={action:'answer',answer:'Erreur'+i,requestId:'request-unique-id-'+i};const results=await Promise.all([post(alice.cookie,request),post(alice.cookie,request)]);assert.ok(results.every(r=>r.status===200));const current=await get(alice.cookie);assert.equal(current.body.tries,i+1);assert.equal(current.body.hints.length,i<2?0:i<5?1:2);assert.equal(current.body.answer,undefined);}
const before=await get(alice.cookie);assert.notEqual(before.body.masked,start.body.masked);assert.equal(before.body.masked,'RATTLL');
let b=await post(bob.cookie,{name:'Bob',action:'answer',answer:q.answer,requestId:'bob-correct-request-001'});assert.equal(b.body.rank,1);assert.equal(b.body.tries,1);const solvedTime=b.body.leaders[0].solvedAt;
now+=1000;const carol=await post('',{name:'Carol'});const c=await post(carol.cookie,{action:'answer',answer:q.answer,requestId:'carol-correct-request-1'});assert.equal(c.body.rank,2);assert.equal(c.body.champion.name,'Bob');
now+=1000;const a=await post(alice.cookie,{action:'answer',answer:q.answer,requestId:'alice-correct-request-1'});assert.equal(a.body.rank,3);assert.equal(a.body.tries,10);assert.equal(a.body.errors,9);assert.equal(a.body.answer,q.answer);
const updated=await post(bob.cookie,{name:'Bobby',avatar:{shape:5,hair:2}});assert.equal(updated.body.tries,1);assert.equal(updated.body.champion.name,'Bobby');assert.equal(updated.body.champion.avatar.shape,5);assert.equal(updated.body.champion.solvedAt,solvedTime);
const retry=await post(bob.cookie,{action:'answer',answer:'wrong',requestId:'already-solved-request-1'});assert.equal(retry.body.tries,1);assert.equal(retry.body.rank,1);
for(let i=0;i<11;i++){now+=1000;const p=await post('',{name:'Player '+i});await post(p.cookie,{action:'answer',answer:q.answer,requestId:'another-player-solve-'+i});}
const page1=await get(alice.cookie,1),page2=await get(alice.cookie,2);assert.equal(page1.body.total,14);assert.equal(page1.body.leaders.length,10);assert.equal(page2.body.leaders.length,4);assert.equal(page2.body.leaders[0].rank,11);assert.equal(page2.body.rank,14);assert.equal(page2.body.champion.rank,1);
assert.ok(!JSON.stringify(page2.body).includes('sv_player'));assert.ok(!JSON.stringify(page2.body).includes('revision'));assert.ok(!JSON.stringify(page2.body).includes('request-unique-id'));
const stored=sql.prepare('SELECT * FROM daily_players WHERE id=?').get(day+':'+alice.cookie.split('=')[1]);assert.equal(stored.started_at,Date.parse('2026-10-17T10:00:00Z'));assert.equal(JSON.parse(stored.state).guesses.length,10);assert.equal(JSON.parse(stored.state).guesses[0].at,stored.started_at);
const {dailyDate}=await import(daily);assert.equal(dailyDate(Date.parse('2026-10-17T21:59:59Z')),day);assert.equal(dailyDate(Date.parse('2026-10-17T22:00:00Z')),'2026-10-18');
now=Date.parse('2026-10-17T22:00:00Z');const next=await get(alice.cookie);assert.equal(next.body.day,'2026-10-18');assert.equal(next.body.tries,0);assert.equal(next.body.total,0);assert.equal((await post(alice.cookie)).status,409);
assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM daily_players WHERE day=?').get(day).n,14);
console.log('Passed daily: same puzzle, protected answer, progressive clues, CAS duplicate submissions, fewest attempts then first solve, saved names/avatars, completed attempt freeze, pagination, personal rank, anonymous public payload, durable analytics timestamps, Paris midnight rollover and archived previous day.');

const {dailyReport}=await import('../scripts/analytics-report.mjs');
const stats=dailyReport(sql.prepare('SELECT * FROM daily_players').all());assert.equal(stats.participants,14);assert.equal(stats.solved,14);assert.equal(stats.guesses,23);assert.equal(stats.incorrect,9);assert.equal(stats.firstTry,13);assert.equal(stats.hintUnlocks.vowel,1);assert.equal(stats.uniqueBrowsers,14);assert.ok(!JSON.stringify(stats).includes('Erreur'));console.log('Passed daily analytics: deduped browsers, attempts, mistakes, solved first try, hints and private guesses excluded from report.');

const {DAILY_QUESTIONS:dailyBank}=await import(dailyBankURI);
assert.equal(dailyBank.length,100);
assert.ok(dailyBank.every(q=>q.theme==='daily')&&dailyBank.slice(48).every(q=>q.answer.split(/\s+/).length>=6));
const oldQuestion=sql.prepare('SELECT question FROM daily_challenges WHERE day=?').get(day).question;
const used=[];
const firstReserved=JSON.parse(sql.prepare('SELECT question FROM daily_challenges WHERE day=?').get('2026-10-18').question).answer;used.push(firstReserved);
for(let offset=1;offset<dailyBank.length;offset++){
 now=Date.parse('2026-10-18T12:00:00Z')+offset*86400000;
 const response=await get();assert.equal(response.status,200);assert.equal(response.body.theme,'daily');assert.equal(response.body.answer,undefined);assert.equal(response.body.source,undefined);
 const entry=JSON.parse(sql.prepare('SELECT question FROM daily_challenges WHERE day=?').get(response.body.day).question);
 assert.ok(!used.includes(entry.answer),'No repeat before the daily bank is exhausted');used.push(entry.answer);
 if(offset===5){const replies=await Promise.all([get(),get(),get()]);assert.ok(replies.every(r=>r.body.masked===response.body.masked),'Concurrent visitors share the saved challenge');}
}
assert.equal(new Set(used).size,100);
now+=86400000;const cycle=await get();assert.equal(cycle.status,200);
const recycled=JSON.parse(sql.prepare('SELECT question FROM daily_challenges WHERE day=?').get(cycle.body.day).question);assert.equal(recycled.answer,firstReserved,'Once exhausted, select the least recently used puzzle');
assert.equal(sql.prepare('SELECT question FROM daily_challenges WHERE day=?').get(day).question,oldQuestion,'A previously published puzzle remains unchanged');
console.log('Passed daily rotation: 100 distinct challenges, oldest-first reuse, concurrent stability, hidden answer/source and preservation of published puzzles.');

const sourced=sql.prepare("SELECT day,question FROM daily_challenges WHERE question LIKE '%https://fr.wiktionary.org/wiki/%' ORDER BY day LIMIT 1").get();assert.ok(sourced);
const sourcedQuestion=JSON.parse(sourced.question);now=Date.parse(sourced.day+'T12:00:00Z');
const answerResponse=await POST(new Request('https://test.local/api/daily',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({day:sourced.day,action:'answer',name:'Source test',answer:sourcedQuestion.aliases?.[0]||sourcedQuestion.answer,requestId:'sourced-daily-answer-request-001'})}));
assert.equal(answerResponse.status,200);const answerPayload=await answerResponse.json();assert.equal(answerPayload.solved,true);assert.equal(answerPayload.source,sourcedQuestion.wiki);assert.equal(answerPayload.answer,sourcedQuestion.answer);
console.log('Passed sourced daily answers: accepted variants and credits disclosed after solving.');
