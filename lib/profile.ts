export const PROFILE_KEY='sv-profile-v1';
export const COLORS=['#d8fc70','#c8b9ff','#ffae92','#8fe1dd','#f8d779','#ff8eb2','#80baff','#f2ede0','#bfa1ff','#b5dd9b'];
export const PARTS=[
 {key:'shape',label:'Visage',options:['Tout rond','Carré doux','Ovale','Petite poire','Nuage','Grand menton']},
 {key:'hair',label:'Coiffure',options:['Sans cheveux','Mèche rousse','Laine pétrole','Banane dorée','Boucles auburn','Carré de laine','Bonnet marine','Mèche Titeuf']},
 {key:'eyes',label:'Yeux',options:['Grand ouverts','Malicieux','Émerveillés','Petites perles','Endormis','Rieurs']},
 {key:'nose',label:'Nez',options:['Sans nez','Classique ovale','Petit rond','Bouton large','Petite poire','Allongé','Retroussé']},
 {key:'mouth',label:'Bouche',options:['Sourire','Grand rire','Surprise','Petit sourire','Grimace','La langue']},
 {key:'accessory',label:'Accessoires',options:['Sans accessoire','Lunettes miel','Lunettes de soleil','Petite fleur','Joues roses','Moustache de laine','Foulard corail']},
 {key:'outfit',label:'Vêtements',options:['Chemise rayée','Pull sauge','Veste prune','Sweat marine','Gilet rouille','Tweed et nœud']},
] as const;
export type PartKey=typeof PARTS[number]['key'];
export type Avatar={shape:number;hair:number;eyes:number;nose:number;mouth:number;accessory:number;outfit:number;color:string;cosmetic?:number;headwear?:number;adornment?:number;costume?:number;premiumHair?:number;premiumEyes?:number};
export type Profile={version:1;name:string;avatar:Avatar};
export const DEFAULT_AVATAR:Avatar={shape:0,hair:1,eyes:0,nose:1,mouth:0,accessory:0,outfit:0,color:'#f8d779'};
export const SHOP_SLOTS=['headwear','adornment','costume','premiumHair','premiumEyes'] as const;
export type ShopSlot=typeof SHOP_SLOTS[number];
export function shopSlot(id:number):ShopSlot|undefined{if(!Number.isInteger(id))return;if(id>=1&&id<=12||id>=17&&id<=22)return 'headwear';if(id>=13&&id<=16||id>=23&&id<=24)return 'adornment';if(id>=25&&id<=32)return 'costume';if(id>=33&&id<=35)return 'premiumHair';if(id>=36&&id<=38)return 'premiumEyes';}
export function equipItem(avatar:Avatar,id:number):Avatar{const slot=shopSlot(id),next=cleanAvatar(avatar);if(slot)next[slot]=id;return next;}
export function removeItem(avatar:Avatar,slot:ShopSlot):Avatar{const next=cleanAvatar(avatar);delete next[slot];return next;}
export function previewItem(avatar:Avatar,id:number):Avatar{const next=equipItem(avatar,id),slot=shopSlot(id);if(slot!=='costume')delete next.costume;if(slot==='premiumHair'||slot==='premiumEyes')delete next.headwear;return next;}
export function cleanAvatar(raw:unknown):Avatar{const value=(raw&&typeof raw==='object'?raw:{}) as Record<string,unknown>;const result={...DEFAULT_AVATAR};for(const p of PARTS){const n=value[p.key];result[p.key]=typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<p.options.length?n:DEFAULT_AVATAR[p.key];}for(const slot of SHOP_SLOTS){const n=value[slot];if(typeof n==='number'&&shopSlot(n)===slot)result[slot]=n;}const legacy=value.cosmetic;if(typeof legacy==='number'){const slot=shopSlot(legacy);if(slot&&result[slot]===undefined)result[slot]=legacy;}result.color=typeof value.color==='string'&&COLORS.includes(value.color)?value.color:DEFAULT_AVATAR.color;return result;}
export function parseProfile(value:string|null):Profile|null{try{if(!value)return null;const p=JSON.parse(value);if(p.version!==1||typeof p.name!=='string'||!p.name.trim()||p.name.trim().length>20||!p.avatar||typeof p.avatar!=='object')return null;return {version:1,name:p.name.trim(),avatar:cleanAvatar(p.avatar)};}catch{return null;}}
export function randomIndex(length:number,current?:number){if(length<2)return 0;let n=Math.floor(Math.random()*(current===undefined?length:length-1));if(current!==undefined&&n>=current)n++;return n;}
export function shufflePart(avatar:Avatar,key:PartKey):Avatar{const part=PARTS.find(p=>p.key===key)!;const next={...avatar,[key]:randomIndex(part.options.length,avatar[key])};if(key==='hair')delete next.premiumHair;if(key==='eyes')delete next.premiumEyes;return next;}
export function shuffleColor(avatar:Avatar):Avatar{return {...avatar,color:COLORS[randomIndex(COLORS.length,COLORS.indexOf(avatar.color))]};}
export function randomAvatar(previous:Avatar=DEFAULT_AVATAR):Avatar{let avatar=shuffleColor(previous);for(const p of PARTS)avatar=shufflePart(avatar,p.key);return avatar;}
const NOUNS=['Kiwi','Panda','Lama','Pixel','Nuage','Koala','Poulpe','Biscuit','Renard','Citron','Tacos','Canard','Piment','Yéti','Robot','Flocon'];
const ADJECTIVES=['Cosmique','Magique','Solaire','Furtif','Malin','Électrique','Lunaire','Sauvage','Épique','Zen','Mystique','Turbo'];
const NAMES=NOUNS.flatMap(n=>ADJECTIVES.map(a=>n+a));
export function randomName(previous=''){const index=NAMES.indexOf(previous);return NAMES[randomIndex(NAMES.length,index<0?undefined:index)];}
