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
let batchTail=Promise.resolve();
globalThis.__testDB={batch(statements){const task=batchTail.then(async()=>{sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}});batchTail=task.catch(()=>{});return task;},prepare(query){let values=[];return {bind(...v){values=v;return this},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}}}}}};
let source=readFileSync('app/api/game/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env={DB:globalThis.__testDB};').replace("'../../../lib/analytics'",JSON.stringify(analytics)).replace("'../../../lib/game'",JSON.stringify(game)).replace("'../../../lib/themes'",JSON.stringify(themes)).replace("'../../../lib/profile'",JSON.stringify(profile));
const {POST,GET}=await import(uri(compile(source)));
let now=1000000;Date.now=()=>now;
async function post(action,cookie='',extra={}){const r=await POST(new Request('https://test.local/api/game',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://test.local',Cookie:cookie},body:JSON.stringify({action,room:'cinema',...extra})}));return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie}}
let a=await post('join','',{name:'Alice'}),b=await post('join','',{name:'Bob'});assert.equal(a.status,200);assert.equal(a.body.phase,'countdown');assert.ok(a.cookie.startsWith('sv_player='));assert.equal(b.body.players.length,2);
now+=10000;let snap=(await post('sync',a.cookie)).body;assert.equal(snap.phase,'guess');assert.equal(snap.question.answer,undefined);
const {QUESTIONS}=await import(game);const state=JSON.parse(sql.prepare('SELECT state FROM rooms WHERE id=?').get('cinema').state);const answer=QUESTIONS[state.deck[0]].answer;
now+=1000;const guesses=await Promise.all([post('answer',a.cookie,{answer,game:snap.game,round:1}),post('answer',a.cookie,{answer,game:snap.game,round:1}),post('answer',b.cookie,{answer,game:snap.game,round:1})]);assert.ok(guesses.every(g=>g.status===200));snap=(await post('sync',a.cookie)).body;assert.equal(snap.phase,'reveal');assert.equal(snap.players.find(p=>p.id==='me').score,955);assert.equal(snap.question.answer,answer);assert.deepEqual(snap.players.map(p=>p.solveRank).sort(),[1,2],'Concurrent submissions must award exactly one first place');
const avatar={shape:4,hair:7,eyes:2,nose:6,mouth:5,accessory:1,outfit:4,color:'#c8b9ff'};
const edited=await post('profile',a.cookie,{name:'KiwiCosmique',avatar});assert.equal(edited.status,200);const editedMe=edited.body.players.find(p=>p.id==='me');assert.equal(editedMe.score,955);assert.equal(editedMe.name,'KiwiCosmique');assert.deepEqual(editedMe.avatar,avatar);
const otherView=(await post('sync',b.cookie)).body;assert.equal(otherView.players.find(p=>p.name==='KiwiCosmique').avatar.color,'#c8b9ff');assert.equal(otherView.players.find(p=>p.name==='KiwiCosmique').avatar.nose,6,'Custom nose propagates to remote players');
const blank=await post('profile',a.cookie,{name:'   ',avatar});assert.equal(blank.status,400);
const refresh=await post('join',a.cookie,{name:'KiwiCosmique',avatar});assert.deepEqual(refresh.body.players.find(p=>p.id==='me').avatar,avatar);assert.equal(refresh.body.players.find(p=>p.id==='me').score,955);
await post('leave',a.cookie);const empty=await post('leave',b.cookie);assert.equal(empty.body.phase,'reveal');assert.equal(empty.body.players.length,0);assert.equal(empty.body.vacancy,undefined);
const list=await GET();assert.equal((await list.json()).rooms.find(r=>r.id==='cinema').count,0);
now+=100000;const restart=await post('join',a.cookie,{name:'Alice'});assert.equal(restart.body.phase,'countdown');assert.equal(restart.body.players.find(p=>p.id==='me').score,0);
// Chat visibility is enforced by the server, survives DB reloads and keeps late joiners out.
const third=await post('join','',{name:'Carol'});now+=10000;const start=(await post('sync',a.cookie)).body;
const stored=JSON.parse(sql.prepare('SELECT state FROM rooms WHERE id=?').get('cinema').state);
const target=QUESTIONS[stored.deck[0]].answer;
await post('answer',a.cookie,{answer:target,game:start.game,round:start.round});
const sent=await post('chat',a.cookie,{message:'secret-answer '+target,game:start.game,round:start.round});assert.equal(sent.body.result,'sent');
const outsider=await post('sync',third.cookie);assert.ok(!JSON.stringify(outsider.body).includes('secret-answer'));
const winner=await post('sync',a.cookie);assert.ok(JSON.stringify(winner.body).includes('secret-answer'));
const rejected=await post('chat',third.cookie,{message:'public shortcut',game:start.game,round:start.round});assert.equal(rejected.body.result,'wait');
const stale=await post('chat',a.cookie,{message:'stale',game:start.game,round:99});assert.equal(stale.status,409);
const emote=await post('emote',third.cookie,{message:'🔥',game:start.game,round:start.round});assert.equal(emote.body.result,'sent');
const observed=(await post('sync',a.cookie)).body;assert.ok(observed.players.some(p=>p.reaction?.text==='🔥'));assert.ok(!observed.messages.some(m=>m.kind==='emote'));
console.log('Passed: SQLite persistence, separate sessions, concurrent guesses, CAS scoring, early reveal, refresh recovery, leave, idle rooms and restart; profile edits preserve score and propagate avatar, blank names refused.');

// Each newly listed room creates durable state and serves its own deck.
for(const room of ['videogames','series','food','music','characters','expressions','objects','myths']){
 const joined=await post('join','',{room,name:'Test salon'});assert.equal(joined.status,200,room);now+=10000;
 const playing=await post('sync',joined.cookie,{room});assert.equal(playing.body.phase,'guess',room);assert.equal(playing.body.question.theme,room);assert.equal(playing.body.question.answer,undefined);
 await post('leave',joined.cookie,{room});
}
console.log('Passed: all eight new room IDs persist independently and serve the correct category.');

// Private analytics: exact counts despite duplicate/concurrent answer requests.
const allEvents=()=>sql.prepare('SELECT events FROM analytics_commits').all().flatMap(r=>JSON.parse(r.events));
const correct=allEvents().filter(e=>e.kind==='guess_correct');
assert.equal(correct.length,3,'Two concurrent solvers, plus Alice in the next match');
assert.equal(allEvents().filter(e=>e.kind==='first_solve_ms').length,2);
assert.equal(allEvents().filter(e=>e.kind==='round_completed').length,1);
assert.equal(sql.prepare("SELECT count FROM analytics_daily WHERE room='cinema' AND metric='guess_correct'").get().count,3);
assert.ok(sql.prepare('SELECT * FROM analytics_player_days').all().length>=3);
assert.ok(allEvents().every(e=>!e.player||/^[a-f0-9]{64}$/.test(e.player)));
assert.ok(!JSON.stringify(allEvents()).includes('secret-answer'));
assert.ok(!JSON.stringify(observed).includes('tracking'));
assert.ok(!JSON.stringify(observed).includes('telemetryCommit'));
const {calendar,telemetryStatements,collector}=await import(analytics);
assert.equal(calendar(Date.parse('2026-10-17T22:30:00Z')).day,'2026-10-18');
assert.equal(calendar(Date.parse('2026-12-17T22:30:00Z')).day,'2026-12-17');
// A deliberately stale CAS cannot leave an analytics event or a session behind.
const c=collector('cinema',now);c.events.push({kind:'must_not_exist',at:now});
await globalThis.__testDB.batch([
 globalThis.__testDB.prepare('UPDATE rooms SET revision=revision+1 WHERE id=? AND revision=?').bind('cinema',-1),
 ...telemetryStatements(globalThis.__testDB,c,{players:[]},99999,'wrong','',0)
]);
assert.ok(!allEvents().some(e=>e.kind==='must_not_exist'));
assert.ok(sql.prepare('SELECT count(*) AS n FROM analytics_sessions WHERE ended IS NOT NULL').get().n>0);
console.log('Passed: atomic analytics, duplicate answers, private pseudonyms, daily totals, sessions and Paris day/DST boundaries.');

// A complete ten-word match reaches the podium once, including streaks and durations.
let solo=await post('join','',{room:'animals',name:'Solo'});
for(let round=1;round<=10;round++){
 now+=round===1?10000:5000;
 const started=await post('sync',solo.cookie,{room:'animals'});
 assert.equal(started.body.round,round);
 const stored=JSON.parse(sql.prepare("SELECT state FROM rooms WHERE id='animals'").get().state);
 now+=1000;
 const solved=await post('answer',solo.cookie,{room:'animals',game:stored.game,round,answer:QUESTIONS[stored.deck[round-1]].answer});
 assert.equal(solved.body.result,'correct');assert.equal(solved.body.phase,'reveal');
}
now+=5000;const podium=await post('sync',solo.cookie,{room:'animals'});assert.equal(podium.body.phase,'podium');
await post('sync',solo.cookie,{room:'animals'});
const animalEvents=sql.prepare("SELECT events FROM analytics_commits WHERE room='animals'").all().flatMap(r=>JSON.parse(r.events));
assert.equal(animalEvents.filter(e=>e.kind==='round_started').length,10);
assert.equal(animalEvents.filter(e=>e.kind==='round_completed').length,10);
assert.equal(animalEvents.filter(e=>e.kind==='match_completed').length,1);
assert.equal(animalEvents.filter(e=>e.kind==='victory').length,1);
assert.equal(Math.max(...animalEvents.filter(e=>e.kind==='streak').map(e=>e.value)),10);
assert.equal(animalEvents.filter(e=>e.kind==='match_duration_ms').length,1);
// Export/report reproduces the actual accepted metrics rather than UI snapshots.
const {report}=await import('../scripts/analytics-report.mjs');
const tables=['analytics_commits','analytics_daily','analytics_player_days','analytics_players','analytics_sessions'];
const exported=Object.fromEntries(tables.map(t=>[t,sql.prepare('SELECT * FROM '+t).all()]));
const stats=report(exported,'0000-00-00','9999-99-99','animals');
assert.equal(stats.counts.match_completed,1);assert.equal(stats.counts.guess_correct,10);
assert.equal(stats.solveMs.median,1000);assert.equal(stats.uniquePlayers,1);
assert.ok(stats.sessionActiveMs.max>0);
// Timeout is inferred from presence and finalized when the room is touched again.
now+=13000;await post('join','',{room:'animals',name:'Next'});
assert.ok(sql.prepare("SELECT * FROM analytics_sessions WHERE room='animals' AND reason='timeout'").all().length);
console.log('Passed: complete match, ten rounds, winner, streak, durations, report export and expired session.');

// A solo player can leave to the menu and recover the same word, score and clock.
let grace=await post('join','',{room:'food',name:'Retour'});
now+=10000;grace=await post('sync',grace.cookie,{room:'food'});
const graceGame=grace.body.game;
now+=2000;
const beforeLeave=await post('sync',grace.cookie,{room:'food'});
const deadline=beforeLeave.body.deadline;
const words=beforeLeave.body.question.masked;
const abandonedBefore=allEvents().filter(e=>e.kind==='match_abandoned').length;
await post('leave',grace.cookie,{room:'food'});
let listing=await GET();assert.equal((await listing.json()).rooms.find(r=>r.id==='food').resumable,true);
now+=9999;
const recovered=await post('join',grace.cookie,{room:'food',name:'Retour'});
assert.equal(recovered.body.game,graceGame);assert.equal(recovered.body.round,1);
assert.equal(recovered.body.question.masked,words);assert.equal(recovered.body.deadline,deadline+9999);
assert.equal(allEvents().filter(e=>e.kind==='match_abandoned').length,abandonedBefore);
assert.equal(allEvents().filter(e=>e.kind==='match_started'&&e.game===graceGame).length,1);
assert.ok(!JSON.stringify(recovered.body).includes('vacancy'));
// Resume a solved player's score and reveal state, not just the word.
const gstate=JSON.parse(sql.prepare("SELECT state FROM rooms WHERE id='food'").get().state);
now+=1000;const won=await post('answer',grace.cookie,{room:'food',game:graceGame,round:1,answer:QUESTIONS[gstate.deck[0]].answer});
await post('leave',grace.cookie,{room:'food'});now+=1000;
const scoreRecovered=await post('join',grace.cookie,{room:'food',name:'Retour'});
assert.equal(scoreRecovered.body.players[0].score,won.body.players[0].score);
assert.equal(scoreRecovered.body.players[0].solved,true);assert.equal(scoreRecovered.body.phase,'reveal');
// Exactly ten seconds is the expiry boundary, including repeated leave requests.
await post('leave',grace.cookie,{room:'food'});now+=5000;
await post('leave',grace.cookie,{room:'food'});now+=5000;
listing=await GET();assert.equal((await listing.json()).rooms.find(r=>r.id==='food').resumable,false);
const replacement=await post('join',grace.cookie,{room:'food',name:'Retour'});
assert.notEqual(replacement.body.game,graceGame);assert.equal(replacement.body.phase,'countdown');
assert.equal(replacement.body.players[0].score,0);
assert.equal(allEvents().filter(e=>e.kind==='match_abandoned'&&e.game===graceGame).length,1);
console.log('Passed: solo room grace, 9.999s recovery, paused timer, score restoration, no duplicate matches, private state and 10s expiry.');
