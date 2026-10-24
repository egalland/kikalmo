'use client';
import {useEffect,useState} from 'react';
import {THEMES} from '../../lib/themes';
import {sortRooms} from '../../lib/lobby.mjs';
import type {Friend} from '../../lib/friends';
import RoomFriends from './RoomFriends';
type Room=typeof THEMES[number]&{count?:number};
export default function MenuRooms({rooms,friends,currentRoom='',busy=false,onJoin}:{rooms?:Room[];friends?:Friend[];currentRoom?:string;busy?:boolean;onJoin?:(id:string)=>void}){
 const [loaded,setLoaded]=useState<Room[]>([]),[peers,setPeers]=useState<Friend[]>([]),[error,setError]=useState('');
 useEffect(()=>{if(rooms)return;let stopped=false;async function load(){if(document.hidden)return;try{const r=await fetch('/api/game');const d=await r.json() as {rooms:Room[]};if(!r.ok||!Array.isArray(d.rooms))throw Error();if(!stopped){setLoaded(d.rooms);setError('');}if(!friends){const f=await fetch('/api/friends');if(f.ok){const data=await f.json() as {friends:Friend[]};if(!stopped)setPeers(data.friends||[]);}}}catch{if(!stopped)setError('Salons indisponibles. Réessayez dans un instant.');}}void load();const timer=setInterval(()=>void load(),10000);return()=>{stopped=true;clearInterval(timer);};},[!!rooms,!!friends]);
 const sorted:Room[]=sortRooms(rooms||loaded),busiest=sorted.find(room=>(room.count||0)>0),companions=friends||peers;
 return <section className="menu-rooms" aria-label="Rejoindre un salon"><h3>Les salons <small>Les plus fréquentés d’abord</small></h3>{error&&<p className="notice error" role="alert">{error}</p>}{!sorted.length&&!error&&<p>Chargement des salons…</p>}{sorted.map(t=>{const content=<><span className="menu-room-symbol" aria-hidden="true">{t.icon}</span><span><strong>{t.name}</strong><small>{t.id===busiest?.id?'Le plus animé · ':''}{t.count||0} joueur{(t.count||0)>1?'s':''}</small><RoomFriends friends={companions.filter(friend=>friend.room===t.id)}/></span></>;return onJoin?<button type="button" className={'menu-room'+(t.id===currentRoom?' current':'')} key={t.id} aria-current={t.id===currentRoom?true:undefined} disabled={busy||(t.count||0)>=30} onClick={()=>onJoin(t.id)}>{content}</button>:<a className="menu-room" key={t.id} href={'/?room='+t.id} aria-disabled={(t.count||0)>=30} onClick={e=>{if((t.count||0)>=30)e.preventDefault();}}>{content}</a>;})}</section>;
}
