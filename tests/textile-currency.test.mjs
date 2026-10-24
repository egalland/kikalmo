import ts from 'typescript';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import sharp from 'sharp';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64'),compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const cosmetics=uri(compile(readFileSync('lib/cosmetics.ts','utf8')));
const source=compile(readFileSync('app/components/Currency.tsx','utf8')).replace('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime'))).replace("'../../lib/cosmetics'",JSON.stringify(cosmetics));
const {CurrencyIcon,CurrencyAmount}=await import(uri(source));
for(const [currency,key,label] of [['room','piece','pièces de laine'],['daily','etoile','étoiles de laine']]){
 const icon=renderToStaticMarkup(createElement(CurrencyIcon,{currency}));assert.ok(icon.includes(key+'.webp'));assert.ok(icon.includes('alt=""'));assert.ok(icon.includes('aria-hidden="true"'));
 for(const amount of [0,8,999,'…']){const markup=renderToStaticMarkup(createElement(CurrencyAmount,{currency,amount}));assert.ok(markup.includes('aria-label="'+amount+' '+label+'"'));assert.ok(markup.includes('role="img"'));}
 const {data,info}=await sharp('public/branding/textile/'+key+'.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,192);assert.ok(data[3]<10,'Token exterior must remain transparent');assert.ok(data[(96*info.width+96)*4+3]>220,'Token center must contain a real wool object');
}
const tile=await sharp('public/branding/textile/felt.webp').metadata();assert.equal(tile.width,384);assert.equal(tile.height,384);
console.log('Passed textile currencies: two shared textured/alpha tokens, explicit accessible currency labels, zero and loading amounts, optimized felt tile.');
