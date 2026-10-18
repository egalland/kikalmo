import {readFileSync,writeFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync('lib/question-bank.json','utf8'));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
const themes=['videogames','series','food','music','characters','expressions','objects','myths'];
const seeds={};let theme='',hint='';
for(const line of readFileSync('data/additional-answers.txt','utf8').split('\n')){
 if(line.startsWith('# ')){[theme,hint]=line.slice(2).split('|');seeds[theme]??=[];continue;}
 if(!line.trim())continue;
 for(const token of line.split(';').map(s=>s.trim()).filter(Boolean)){
  const [names,wikiOverride]=token.split('=');const [answer,...aliases]=names.split('~');
  const q={answer,theme,wiki:wikiOverride||answer.replaceAll(' ','_'),hint,...(aliases.length?{aliases}:{}),...(theme==='expressions'?{illustration:{url:null,page:null,credit:''}}:{})};
  if(!seeds[theme].some(x=>norm(x.answer)===norm(answer)))seeds[theme].push(q);
 }
}
const counts={};
for(const t of themes){
 const existing=new Set(bank.filter(q=>q.theme===t).map(q=>norm(q.answer)));
 const candidates=seeds[t].filter(q=>!existing.has(norm(q.answer))&&/[aeiouy]/.test(norm(q.answer))&&/[bcdfghjklmnpqrstvwxz]/.test(norm(q.answer))&&q.answer.length<=90);
 if(existing.size===0)bank.push(...candidates);
 counts[t]=bank.filter(q=>q.theme===t).length;if(counts[t]<200)throw Error(t+' has only '+counts[t]);
}
// Append-only expansion: never reorder indices referenced by active room decks.
const expansion=JSON.parse(readFileSync('data/expansion-500.json','utf8'));
const clues=JSON.parse(readFileSync('lib/question-clues.json','utf8'));
const clueSources=JSON.parse(readFileSync('lib/question-clue-sources.json','utf8'));
const audit=JSON.parse(readFileSync('data/clue-sources.json','utf8'));
for(const entry of expansion.entries){
 const {kind,source,...q}=entry;const key=q.theme+':'+norm(q.answer);
 const existing=bank.find(old=>old.theme===q.theme&&norm(old.answer)===norm(q.answer));
 if(!existing){
  if(bank.some(old=>old.theme===q.theme&&old.wiki===q.wiki))throw Error('Duplicate article: '+q.wiki);
  bank.push(q);
 }else if(existing.hint!==q.hint){throw Error('Expansion would alter an existing question: '+q.answer);}
 if(q.hint.length<15||q.hint.length>190||[q.answer,...q.aliases||[]].some(a=>norm(a).length>=3&&norm(q.hint).includes(norm(a))))throw Error('Invalid clue: '+q.answer);
 clues[key]=q.hint;
 audit.entries[key]={kind:kind==='editorial'?'editorial':kind,page:source,title:q.wiki.replaceAll('_',' '),...(source?{license:'CC BY-SA 4.0',retrieved:expansion.retrieved}:{})};
 if(source)clueSources[key]=source;
}
for(const theme of Object.keys(counts)){const count=bank.filter(q=>q.theme===theme).length;if(count!==500)throw Error(theme+' must contain exactly 500 answers, got '+count);}
writeFileSync('lib/question-clues.json',JSON.stringify(clues,null,2)+'\n');
writeFileSync('lib/question-clue-sources.json',JSON.stringify(clueSources,null,2)+'\n');
writeFileSync('data/clue-sources.json',JSON.stringify(audit,null,2)+'\n');
writeFileSync('lib/question-bank.json',JSON.stringify(bank,null,2)+'\n');
const allCounts={general:bank.length};for(const q of bank)allCounts[q.theme]=(allCounts[q.theme]||0)+1;
writeFileSync('lib/bank-info.ts',`// Client-safe catalogue sizes; the answer bank stays on the server.\nexport const BANK_VERSION='2026-10-18-500';\nexport const QUESTION_COUNTS=${JSON.stringify(allCounts)} as const;\n`);
console.log(JSON.stringify(allCounts));
