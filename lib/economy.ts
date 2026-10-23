import type {Avatar} from './profile';
import {COSMETICS,type Wallet} from './cosmetics';
// Rewards begin with this release; older daily competitions are not re-awarded.
export const REWARDS_FROM='2026-10-23';
export function dailyPrize(rank:number|null){return rank===1?5:rank===2?3:rank===3?2:1;}
export function settleDailyStatement(db:D1Database,day:string,now=Date.now()){
 // Rank against the entire closed day before filtering recipients. A real attempt is participation.
 return db.prepare(`INSERT OR IGNORE INTO economy_ledger(id,player,currency,delta,item,created_at)
 SELECT 'daily:'||day||':'||player,player,'daily',
 CASE WHEN solved_at IS NULL THEN 1 WHEN position=1 THEN 5 WHEN position=2 THEN 3 WHEN position=3 THEN 2 ELSE 1 END,NULL,?
 FROM (SELECT day,player,solved_at,ROW_NUMBER() OVER(PARTITION BY day ORDER BY solved_at IS NULL,tries,solved_at,id) AS position
 FROM daily_players WHERE day>=? AND day<? AND tries>0)`).bind(now,REWARDS_FROM,day);
}
export async function wallet(db:D1Database,player:string):Promise<Wallet>{
 const rows=await db.prepare('SELECT currency,coalesce(sum(delta),0) AS balance FROM economy_ledger WHERE player=? GROUP BY currency').bind(player).all<{currency:string;balance:number}>();
 const owned=await db.prepare('SELECT item FROM economy_ledger WHERE player=? AND item IS NOT NULL AND delta<0').bind(player).all<{item:number}>();
 return {room:rows.results.find(r=>r.currency==='room')?.balance||0,daily:rows.results.find(r=>r.currency==='daily')?.balance||0,owned:owned.results.map(r=>r.item)};
}
export function roomPrizeStatement(db:D1Database,player:string,room:string,game:string,round:number,revision:number,nonce:string){
 // Same D1 batch as the room CAS: a losing retry cannot create a credit.
 return db.prepare(`INSERT OR IGNORE INTO economy_ledger(id,player,currency,delta,item,created_at)
 SELECT ?,?,'room',1,NULL,? FROM rooms WHERE id=? AND revision=? AND json_extract(state,'$.telemetryCommit')=?`)
 .bind('round:'+room+':'+game+':'+round,player,Date.now(),room,revision,nonce);
}
export async function allowedCosmetic(db:D1Database,player:string,id:unknown){
 if(typeof id!=='number'||!COSMETICS.some(c=>c.id===id))return undefined;
 const owned=await db.prepare('SELECT id FROM economy_ledger WHERE id=? AND player=? AND item=? AND delta<0').bind('purchase:'+player+':'+id,player,id).first();
 return owned?id:undefined;
}
export function purchaseStatement(db:D1Database,player:string,item:typeof COSMETICS[number]){
 // One atomic statement, authoritative price, unique purchase ID, no negative wallet on concurrent buys.
 return db.prepare(`INSERT OR IGNORE INTO economy_ledger(id,player,currency,delta,item,created_at)
 SELECT ?,?,?,?, ?,? WHERE coalesce((SELECT sum(delta) FROM economy_ledger WHERE player=? AND currency=?),0)>=?`)
 .bind('purchase:'+player+':'+item.id,player,item.currency,-item.price,item.id,Date.now(),player,item.currency,item.price);
}

export async function ownedAppearance(db:D1Database,player:string,avatar:Avatar):Promise<Avatar>{
 const next={...avatar};const slots=['headwear','adornment','costume','premiumHair','premiumEyes'] as const;
 if(!slots.some(slot=>next[slot]))return next;
 const rows=await db.prepare('SELECT item FROM economy_ledger WHERE player=? AND item IS NOT NULL AND delta<0').bind(player).all<{item:number}>();
 const owned=new Set(rows.results.map(r=>r.item));for(const slot of slots)if(next[slot]&&!owned.has(next[slot]!))delete next[slot];return next;
}
