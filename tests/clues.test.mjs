import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const inline=(source)=>source.replace("import questionBank from './question-bank.json';",'const questionBank='+readFileSync('lib/question-bank.json','utf8')+';').replace("import questionClues from './question-clues.json';",'const questionClues='+readFileSync('lib/question-clues.json','utf8')+';').replace("import clueSources from './question-clue-sources.json';",'const clueSources='+readFileSync('lib/question-clue-sources.json','utf8')+';');
const source=ts.transpileModule(inline(readFileSync('lib/game.ts','utf8')),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {QUESTIONS,roundHint,view,normalize}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const edited=JSON.parse(readFileSync('lib/question-clues.json','utf8'));
assert.equal(Object.keys(edited).length,QUESTIONS.length,'Every bank entry has an offline edited clue');
const repetitions=new Map();
for(const [key,clue] of Object.entries(edited)){const signature=key.split(':')[0]+':'+clue;repetitions.set(signature,(repetitions.get(signature)||0)+1);}
assert.ok(Math.max(...repetitions.values())<=2,'No mass-repeated generic clue inside a room');
const newThemes=['videogames','series','food','music','characters','expressions','objects','myths'];
for(const q of QUESTIONS){
 const clue=roundHint(q);assert.ok(clue.length>=15&&clue.length<=190,q.answer);
 assert.ok(![q.answer,...q.aliases||[]].map(normalize).filter(s=>s.length>=3).some(s=>normalize(clue).includes(s)),'Answer/alias leaked in '+q.answer);
 if(newThemes.includes(q.theme)){
  assert.ok(edited[q.theme+':'+normalize(q.answer)],'Every added room must have a question-specific clue: '+q.answer);
  assert.doesNotMatch(clue,/un titre à retrouver|un nom de la scène|un objet de la maison ou du quotidien|une expression française :|Le début de la réponse/iu);
 }
}
const checks=[['expressions','Poser un lapin',/rendez-vous/],['food','Raclette',/fromage/],['videogames','Minecraft',/blocs/],['series','Breaking Bad',/chimie/],['characters','Dark Vador',/Sith/],['myths','Zeus',/foudre/],['objects','Aspirateur',/appareil|poussière|aspir/i]];
for(const [theme,answer,pattern] of checks)assert.match(roundHint(QUESTIONS.find(q=>q.theme===theme&&q.answer===answer)),pattern);
const question=QUESTIONS.findIndex(q=>q.theme==='objects'&&q.answer==='Aspirateur');
const state={players:[{id:'p',name:'p',score:0,seen:0,solved:false,gain:0,tries:0}],phase:'guess',deadline:20000,started:0,round:1,deck:[question],game:'test'};
assert.equal(view(state,'p',9999).question.clue,undefined);
for(const now of [10000,19999]){const q=view(state,'p',now).question;assert.ok(q.clue);assert.equal(q.hintSource,undefined);assert.equal(q.wiki,undefined);assert.equal(q.answer,undefined);}
state.phase='reveal';const revealed=view(state,'p',20000).question;assert.ok(revealed.hintSource?.startsWith('https://fr.wikipedia.org/wiki/'));assert.equal(revealed.hint,roundHint(QUESTIONS[question]));
console.log(`Passed: ${QUESTIONS.length} answer-safe clues, every added-room entry covered, specific semantic fixtures, ten-second server gating and source URL hidden until reveal.`);
