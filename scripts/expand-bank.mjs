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
writeFileSync('lib/question-bank.json',JSON.stringify(bank,null,2)+'\n');
const allCounts={general:bank.length};for(const q of bank)allCounts[q.theme]=(allCounts[q.theme]||0)+1;
writeFileSync('lib/bank-info.ts',`// Client-safe catalogue sizes; the answer bank stays on the server.\nexport const BANK_VERSION='2026-10-16-expanded';\nexport const QUESTION_COUNTS=${JSON.stringify(allCounts)} as const;\n`);
console.log(JSON.stringify(allCounts));
