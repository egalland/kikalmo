import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('lib/profile.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {PROFILE_KEY,COLORS,PARTS,DEFAULT_AVATAR,cleanAvatar,parseProfile,shufflePart,shuffleColor,randomAvatar,randomName,equipItem,removeItem,previewItem,SHOP_SLOTS,shopSlot}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(let i=0;i<200;i++){const a=randomAvatar();for(const p of PARTS){assert.ok(a[p.key]>=0&&a[p.key]<p.options.length);assert.notEqual(a[p.key],DEFAULT_AVATAR[p.key]);const next=shufflePart(a,p.key);assert.notEqual(next[p.key],a[p.key]);for(const other of PARTS.filter(x=>x.key!==p.key))assert.equal(next[other.key],a[other.key]);assert.equal(next.color,a.color);}assert.notEqual(shuffleColor(a).color,a.color);const name=randomName('KiwiCosmique');assert.notEqual(name,'KiwiCosmique');assert.ok(name.length<=20);assert.ok(COLORS.includes(a.color));}
assert.deepEqual(cleanAvatar({shape:999,hair:-1,eyes:1.5,mouth:'2',accessory:null,color:'url(fake)'}),DEFAULT_AVATAR);
assert.equal(parseProfile('bad json'),null);assert.equal(parseProfile(null),null);assert.equal(parseProfile(JSON.stringify({version:1,name:' ',avatar:{}})),null);assert.equal(parseProfile(JSON.stringify({version:7,name:'Kiwi',avatar:{}})),null);
const migrated=parseProfile(JSON.stringify({version:1,name:'AncienProfil',avatar:{shape:2,hair:3,eyes:1,mouth:0,accessory:1,color:COLORS[0]}}));assert.equal(migrated.name,'AncienProfil');assert.equal(migrated.avatar.shape,2);assert.equal(migrated.avatar.outfit,DEFAULT_AVATAR.outfit);assert.equal(cleanAvatar({outfit:999}).outfit,DEFAULT_AVATAR.outfit);
const storage=new Map();const expected={version:1,name:randomName(),avatar:randomAvatar()};storage.set(PROFILE_KEY,JSON.stringify(expected));assert.deepEqual(parseProfile(storage.get(PROFILE_KEY)),expected);assert.equal(parseProfile(JSON.stringify({...expected,name:'a'.repeat(21)})),null);
console.log('Passed: all avatar parts, independent randomizers, guaranteed change, colors, pseudo limits, malformed profiles, round-trip serialization and restored profile.');

assert.equal(migrated.avatar.nose,1,'Old profiles retain a classic nose');assert.equal(cleanAvatar({nose:0}).nose,0);assert.equal(cleanAvatar({nose:999}).nose,1);assert.ok(PARTS.find(p=>p.key==='nose').options.length===7);

assert.equal(cleanAvatar({hair:7}).hair,7);assert.equal(parseProfile(JSON.stringify({version:1,name:'Mèche',avatar:{...DEFAULT_AVATAR,hair:7}})).avatar.hair,7);

assert.equal(cleanAvatar({cosmetic:25}).costume,25);assert.equal(cleanAvatar({cosmetic:32}).costume,32);assert.equal(cleanAvatar({cosmetic:1}).headwear,1);
let layered={...DEFAULT_AVATAR,hair:5,accessory:1};for(const id of [1,15,25,34,37])layered=equipItem(layered,id);
assert.deepEqual(SHOP_SLOTS.map(s=>layered[s]),[1,15,25,34,37,undefined]);assert.equal(layered.hair,5);assert.equal(layered.accessory,1);
const naked=removeItem(layered,'costume');assert.equal(naked.costume,undefined);assert.equal(naked.headwear,1);assert.equal(naked.adornment,15);assert.equal(layered.costume,25);
const preview=previewItem(layered,33);assert.equal(preview.costume,undefined);assert.equal(preview.headwear,undefined);assert.equal(preview.premiumHair,33);assert.equal(layered.costume,25);assert.equal(layered.premiumHair,34);
assert.equal(cleanAvatar({...DEFAULT_AVATAR,headwear:25,costume:1,premiumEyes:34,premiumHair:38,adornment:999}).costume,undefined);
assert.equal(shopSlot(1.5),undefined);assert.equal(shopSlot(50),undefined);assert.equal(shufflePart(layered,'hair').premiumHair,undefined);assert.equal(shufflePart(layered,'eyes').premiumEyes,undefined);
console.log('Passed independent wardrobe slots, legacy migration, isolated previews, category validation and removal preserving identity.');

const patterned=equipItem(layered,48);assert.equal(patterned.fabric,48);assert.equal(removeItem(patterned,'fabric').headwear,1);assert.equal(cleanAvatar({...DEFAULT_AVATAR,fabric:39}).fabric,undefined);
