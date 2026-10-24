import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('lib/game.ts','utf8').replace("import questionBank from './question-bank.json';",'const questionBank='+readFileSync('lib/question-bank.json','utf8')+';').replace("import questionClues from './question-clues.json';",'const questionClues='+readFileSync('lib/question-clues.json','utf8')+';').replace("import clueSources from './question-clue-sources.json';",'const clueSources='+readFileSync('lib/question-clue-sources.json','utf8')+';'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {fresh,begin,advance,submit,view,QUESTIONS,mask,normalize,depart}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const player=(id,t)=>({id,name:id,score:0,seen:t,solved:false,gain:0,tries:0});
let now=100000,s=fresh();s.players=[player('alice',now),player('bob',now)];begin(s,'cinema',now);
assert.equal(s.deck.length,10);assert.equal(new Set(s.deck).size,10);assert.ok(s.deck.every(i=>QUESTIONS[i].theme==='cinema'));
assert.equal(s.deadline,now+10000);assert.equal(advance(s,now+9999).phase,'countdown');now+=10000;s=advance(s,now);assert.equal(s.round,1);assert.equal(s.phase,'guess');assert.ok(!JSON.stringify(view(s,'alice',now)).includes('"answer"'));
const correct=QUESTIONS[s.deck[0]].answer;
assert.equal(submit(s,'alice','wrong',now),'incorrect');assert.equal(s.players[0].score,0);
assert.equal(submit(s,'alice',correct,now+1000),'correct');assert.equal(s.players[0].score,955);assert.equal(submit(s,'alice',correct,now+2000),'wait');
s=advance(s,now+1000);assert.equal(s.phase,'guess');
assert.equal(submit(s,'bob',correct,now+2000),'correct');s.players.forEach(p=>p.seen=now+2000);s=advance(s,now+2000);assert.equal(s.phase,'reveal');assert.equal(s.deadline,now+7000);assert.equal(view(s,'alice',now).question.answer,correct);
s.players.push(player('carol',now+2000));assert.equal(s.players[2].score,0);
now+=7000;s.players.forEach(p=>p.seen=now);s=advance(s,now);assert.equal(s.round,2);assert.equal(s.phase,'guess');assert.ok(s.players.every(p=>!p.solved));
for(let round=2;round<=10;round++){now+=20000;s.players.forEach(p=>p.seen=now);s=advance(s,now);assert.equal(s.phase,'reveal');assert.equal(s.round,round);now+=5000;s.players.forEach(p=>p.seen=now);s=advance(s,now);assert.equal(s.phase,round===10?'podium':'guess');}
assert.equal(s.round,10);s.players=[];s=advance(s,now);assert.equal(s.phase,'empty');assert.equal(s.round,0);
s=fresh();s.players=[player('disconnected',now-12001)];begin(s,'general',now);s=advance(s,now);assert.ok(s.vacancy);assert.equal(advance(s,now+10000).phase,'empty');
assert.equal(normalize('Léonard DE Vinci !'),normalize('Leonard de Vinci'));assert.equal(mask('Bonjour à vous !'),'BNJR  VS !');
console.log('Passed: hidden answers, scoring, duplicate answers, late join, early reveal, all 10 rounds, podium, empty rooms, disconnected players, normalization.');

// A player leaving a populated room never pauses the others.
s=fresh();s.players=[player('one',now),player('two',now)];begin(s,'cinema',now);
const runningDeadline=s.deadline;depart(s,'one',now+1000);s=advance(s,now+1000);
assert.equal(s.vacancy,undefined);assert.equal(s.deadline,runningDeadline);assert.equal(s.players[0].id,'two');
// A disconnected solo player gets ten seconds after the 12-second presence timeout.
s=fresh();s.players=[player('offline',now)];begin(s,'cinema',now);const match=s.game;
s=advance(s,now+12000);assert.equal(s.vacancy.until,now+22000);assert.equal(s.game,match);
const restored={...s.vacancy.players[0],seen:now+15000};s.players.push(restored);s=advance(s,now+15000);
assert.equal(s.game,match);assert.equal(s.deadline,now+35000);assert.equal(s.phase,'guess');
// A newly arriving player may also resume the still-paused room, but not inherit a score.
s=fresh();s.players=[{...player('old',now),score:200}];begin(s,'cinema',now);depart(s,'old',now+1000);
s.players.push(player('new',now+2000));s=advance(s,now+2000);assert.equal(s.players[0].score,0);assert.equal(s.phase,'countdown');

// Room rotation survives an empty room and does not reveal future question indices.
let rotation=fresh(),previous=[];
for(let game=0;game<13;game++){
 rotation.players=[player('rotation',now)];begin(rotation,'general',now);
 const blocked=new Set(previous.slice(-100).map(i=>normalize(QUESTIONS[i].answer)));
 assert.equal(rotation.deck.length,10);assert.ok(rotation.deck.every(i=>!blocked.has(normalize(QUESTIONS[i].answer))));
 assert.equal(new Set(rotation.deck.map(i=>normalize(QUESTIONS[i].answer))).size,10);
 assert.equal(view(rotation,'rotation',now).recentQuestions,undefined);
 previous.push(...rotation.deck);
 if(game===3){rotation.players=[];rotation=advance(rotation,now);assert.equal(rotation.phase,'empty');assert.ok(rotation.recentQuestions.length);}
}
assert.ok(rotation.recentQuestions.length<=100);
console.log('Passed room rotation: last ten decks excluded, unique answers, empty-room persistence, bounded private history and legacy state compatibility.');
