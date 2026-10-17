import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const mock=[{wiki:'Cache_FR',illustration:{url:'https://upload.wikimedia.org/test.jpg',page:'https://fr.wikipedia.org/wiki/Cache_FR',credit:'source'}},{wiki:'No_FR',wikiEn:'English_film'},{wiki:'No_image'},{wiki:'Expression',illustration:{url:null,page:null,credit:''}}];
const telemetry=[];globalThis.__illustrationTelemetry=telemetry;
const source=readFileSync('app/api/illustration/route.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env={DB:{}};').replace("import {calendar,operational} from '../../../lib/analytics';","const calendar=()=>({day:'2026-10-17'}); const operational=async(...a)=>globalThis.__illustrationTelemetry.push(a);").replace("import {QUESTIONS} from '../../../lib/game';",'const QUESTIONS='+JSON.stringify(mock)+';');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {GET}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const original=globalThis.fetch;let calls=[];
globalThis.fetch=async url=>{calls.push(url);return Response.json(url.includes('en.wikipedia')?{thumbnail:{source:'https://upload.wikimedia.org/poster.jpg'},content_urls:{desktop:{page:'https://en.wikipedia.org/wiki/English_film'}}}:{});};
let r=await GET(new Request('https://example.test/api/illustration?title=Cache_FR'));assert.deepEqual(await r.json(),mock[0].illustration);assert.equal(calls.length,0);
r=await GET(new Request('https://example.test/api/illustration?title=No_FR'));let d=await r.json();assert.equal(d.url,'https://upload.wikimedia.org/poster.jpg');assert.ok(d.page.startsWith('https://en.wikipedia.org/'));assert.equal(calls.length,2);
r=await GET(new Request('https://example.test/api/illustration?title=No_image'));assert.equal((await r.json()).url,null);
r=await GET(new Request('https://example.test/api/illustration?title=https://evil.example'));assert.equal(r.status,400);
const count=calls.length;r=await GET(new Request('https://example.test/api/illustration?title=Expression'));assert.equal((await r.json()).url,null);assert.equal(calls.length,count,'Text-only answers must not fetch an unrelated image');
globalThis.fetch=original;
console.log('Passed: cached illustration without network, English fallback, missing-image state, unknown title rejected.');

assert.equal(telemetry.length,2,'Unavailable images are observed, including intentional text-only responses');
