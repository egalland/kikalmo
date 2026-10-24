import {THEMES} from './themes';
import {cleanAvatar,type Avatar} from './profile';
export type Friend={playerKey?:string;code:string;name:string;avatar:Avatar;online:boolean;room:string|null;hidden:boolean};
export type FriendsData={me:{code:string;visible:boolean}|null;friends:Friend[];incoming:Friend[];outgoing:Friend[];blocked:{code:string;name:string;playerKey?:string}[]};
type Person={player:string;code:string;name:string;avatar:string;seen:number;visible:number};
export function friendCode(value:unknown){return typeof value==='string'?value.replace(/[\s-]/g,'').toUpperCase():'';}
export async function friendsSnapshot(db:D1Database,player?:string,now=Date.now()):Promise<FriendsData>{
 const empty:FriendsData={me:null,friends:[],incoming:[],outgoing:[],blocked:[]};if(!player)return empty;
 const me=await db.prepare('SELECT code,visible FROM friend_profiles WHERE player=?').bind(player).first<{code:string;visible:number}>();if(!me)return empty;
 const [peers,rooms,blocks]=await Promise.all([
  db.prepare(`SELECT p.*,l.status,l.requester FROM friend_links l JOIN friend_profiles p ON p.player=CASE WHEN l.requester=? THEN l.recipient ELSE l.requester END WHERE (l.requester=? OR l.recipient=?) AND NOT EXISTS(SELECT 1 FROM friend_blocks b WHERE (b.owner=? AND b.target=p.player) OR (b.owner=p.player AND b.target=?))`).bind(player,player,player,player,player).all<Person&{status:string;requester:string}>(),
  db.prepare('SELECT id,state FROM rooms').all<{id:string;state:string}>(),
  db.prepare('SELECT p.code,p.name,p.player FROM friend_blocks b JOIN friend_profiles p ON p.player=b.target WHERE b.owner=?').bind(player).all<{code:string;name:string;player:string}>()
 ]);
 const locations=new Map<string,{room:string;seen:number}>();for(const row of rooms.results){if(!THEMES.some(t=>t.id===row.id))continue;try{const s=JSON.parse(row.state);for(const p of s.players||[])if(now-p.seen<12000&&p.seen>(locations.get(p.id)?.seen??0))locations.set(p.id,{room:row.id,seen:p.seen});}catch{}}
 const result:FriendsData={...empty,me:{code:me.code,visible:!!me.visible},blocked:blocks.results.map(({player,code,name})=>({code,name,playerKey:player.slice(0,8)}))};
 for(const p of peers.results){const accepted=p.status==='accepted',visible=accepted&&!!p.visible,location=visible?locations.get(p.player):undefined;let avatar;try{avatar=cleanAvatar(JSON.parse(p.avatar));}catch{avatar=cleanAvatar({});}
  const item:Friend={playerKey:p.player.slice(0,8),code:p.code,name:p.name,avatar,online:visible&&(!!location||now-p.seen<45000),room:location?.room||null,hidden:accepted&&!p.visible};
  (accepted?result.friends:p.requester===player?result.outgoing:result.incoming).push(item);
 }
 result.friends.sort((a,b)=>Number(!!b.room)-Number(!!a.room)||Number(b.online)-Number(a.online)||a.name.localeCompare(b.name,'fr'));return result;
}
