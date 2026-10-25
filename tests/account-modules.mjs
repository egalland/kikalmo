import ts from 'typescript';import {readFileSync} from 'node:fs';
export const identityURI='data:text/javascript;base64,'+Buffer.from(ts.transpileModule(readFileSync('lib/account-identity.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
