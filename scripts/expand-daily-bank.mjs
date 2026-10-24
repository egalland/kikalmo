import {readFileSync,writeFileSync} from 'node:fs';
const path='lib/daily-bank.ts',marker='// Longer, reviewed additions with linked definition sources, reserved for the daily mode.';
const base=readFileSync(path,'utf8').split(marker)[0].trimEnd();
const {entries}=JSON.parse(readFileSync('data/daily-expansion-100.json','utf8'));
if(entries.length!==52)throw Error('Expected 52 reviewed additions');
const items=entries.map(({source,...q})=>({...q,theme:'daily',wiki:source}));
writeFileSync(path,base+'\n\n'+marker+'\nDAILY_QUESTIONS.push(...'+JSON.stringify(items,null,2)+');\n');
