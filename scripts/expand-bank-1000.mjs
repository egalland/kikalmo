import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
const bank=read('lib/question-bank.json'),expansion=read('data/expansion-1000.json');
if(createHash('sha256').update(JSON.stringify(bank.slice(0,6000))).digest('hex')!==expansion.previousBankSha256)throw Error('Published bank prefix changed');
const clues=read('lib/question-clues.json'),sources=read('lib/question-clue-sources.json'),audit=read('data/clue-sources.json');
const byKey=new Map(bank.map(q=>[q.theme+':'+normalize(q.answer),q]));
const articles=new Set(bank.map(q=>q.theme+':'+q.wiki));
for(const entry of expansion.entries){
 const {kind,source,...q}=entry,key=q.theme+':'+normalize(q.answer);
 const existing=byKey.get(key);
 if(existing){if(JSON.stringify(existing)!==JSON.stringify(q))throw Error('Existing question differs: '+q.answer);}
 else{if(articles.has(q.theme+':'+q.wiki))throw Error('Duplicate article: '+q.wiki);bank.push(q);byKey.set(key,q);articles.add(q.theme+':'+q.wiki);}
 if(q.hint.length<20||q.hint.length>190||[q.answer,...q.aliases||[]].some(a=>normalize(a).length>=3&&normalize(q.hint).includes(normalize(a))))throw Error('Invalid clue: '+q.answer);
 clues[key]=q.hint;sources[key]=source;audit.entries[key]={kind,page:source,title:q.wiki.replaceAll('_',' '),retrieved:expansion.retrieved,license:kind==='wikidata-description'?'CC0':'CC BY-SA 4.0'};
}
Object.assign(clues,read('data/editorial-clues.json'));
const counts={general:bank.length};for(const q of bank)counts[q.theme]=(counts[q.theme]||0)+1;
if(bank.length!==12000||Object.entries(counts).some(([k,n])=>k!=='general'&&n!==1000))throw Error('Expected 1,000 questions per theme');
for(const [path,value] of [['lib/question-bank.json',bank],['lib/question-clues.json',clues],['lib/question-clue-sources.json',sources],['data/clue-sources.json',audit]])writeFileSync(path,JSON.stringify(value,null,2)+'\n');
writeFileSync('lib/bank-info.ts',`// Client-safe catalogue sizes; answers remain server-only.\nexport const BANK_VERSION='2026-10-24-1000';\nexport const QUESTION_COUNTS=${JSON.stringify(counts)} as const;\n`);
console.log(counts);
