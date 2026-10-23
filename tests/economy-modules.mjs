import ts from 'typescript';
import {readFileSync} from 'node:fs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
export const cosmeticsURI=uri(compile(readFileSync('lib/cosmetics.ts','utf8')));
export const economyURI=uri(compile(readFileSync('lib/economy.ts','utf8').replace("'./cosmetics'",JSON.stringify(cosmeticsURI))));
export const dailyBankURI=uri(compile(readFileSync('lib/daily-bank.ts','utf8')));
export const calendarURI=uri(compile(readFileSync('lib/daily.ts','utf8').split('\n').find(line=>line.startsWith('export function dailyDate'))));
