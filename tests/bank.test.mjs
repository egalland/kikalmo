import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bank=JSON.parse(readFileSync('lib/question-bank.json','utf8'));
const uri=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {THEMES}=await import(uri(readFileSync('lib/themes.ts','utf8')));
const {QUESTION_COUNTS}=await import(uri(readFileSync('lib/bank-info.ts','utf8')));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
assert.equal(bank.length,QUESTION_COUNTS.general);
assert.deepEqual(bank.slice(0,60).map(q=>q.answer),JSON.parse(readFileSync('tests/fixtures/legacy-answers.json','utf8')));
assert.equal(createHash('sha256').update(JSON.stringify(bank.slice(0,2000))).digest('hex'),'abe8396fc54745454fbaaa84aa83ddb4e57bdf07c3587e26bb5eefa84338e549','Existing games retain all 2,000 original entries at their original indices');
assert.equal(createHash('sha256').update(JSON.stringify(bank.slice(0,4382))).digest('hex'),'b97d7780371c1d327aea142ada8a96c0e89b398d2a98e8e67b5579b62c7a6080','All 4,382 previously published questions retain their indices and content');
for(const {id:theme} of THEMES.filter(t=>t.id!=='general')){
 const entries=bank.filter(q=>q.theme===theme);
 assert.equal(entries.length,500,'Every thematic room has exactly 500 questions: '+theme);
 assert.equal(entries.length,QUESTION_COUNTS[theme],'UI count does not match the actual bank');
 assert.equal(new Set(entries.map(q=>normalize(q.answer))).size,entries.length,'Duplicate answer: '+theme);
 assert.equal(new Set(entries.map(q=>q.wiki)).size,entries.length,'Duplicate article key: '+theme);
 for(const q of entries){
  assert.ok(q.answer.trim()&&q.hint.trim()&&q.wiki.trim());
  assert.ok(/[aeiouy]/.test(normalize(q.answer)),'No vowel to remove: '+q.answer);
  assert.ok(/[bcdfghjklmnpqrstvwxz0-9]/i.test(normalize(q.answer)),'No consonant to display: '+q.answer);
  assert.ok(q.answer.length<=90,'Overlong answer: '+q.answer);
  assert.ok(!/[|=~]/.test(q.answer),'Unparsed seed token in answer');
  if(q.illustration?.url){assert.ok(/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(q.illustration.url));assert.ok(/^https:\/\/(fr|en)\.wikipedia\.org\/wiki\//.test(q.illustration.page));}
  for(const alias of q.aliases||[])assert.ok(alias.trim()&&alias.length<=100);
 }
}
assert.ok(bank.every(q=>THEMES.some(t=>t.id===q.theme)),'Unknown theme in bank');
console.log(`Passed: ${bank.length} playable answers, ${THEMES.length-1} thematic rooms, 500 unique answers each, UI counts, safe images and unchanged original 2,000 entries.`);
