'use client';
import {useEffect,useRef,useState} from 'react';
import type {FriendsData} from '../../lib/friends';
import type {Profile} from '../../lib/profile';
const empty:FriendsData={me:null,friends:[],incoming:[],outgoing:[],blocked:[]};
export default function useFriends(profile:Profile|null){
 const [data,setData]=useState<FriendsData>(empty),[error,setError]=useState(''),[busy,setBusy]=useState(false);const current=useRef(profile),known=useRef(false),generation=useRef(0),lock=useRef(false);current.current=profile;
 async function request(action?:string,extra:Record<string,unknown>={}){const mine=++generation.current;const r=await fetch('/api/friends',action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...(['register','pulse'].includes(action)?{name:current.current?.name,avatar:current.current?.avatar}:{}),...extra})}:undefined);const result=await r.json() as FriendsData&{error?:string;room?:string};if(!r.ok)throw Error(result.error||'Panneau d’amis indisponible.');if(result.friends&&mine===generation.current){known.current=!!result.me;setData(result);}return result;}
 async function action(action:string,extra:Record<string,unknown>={}){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{return await request(action,extra);}catch(e){setError(e instanceof Error?e.message:'Demande impossible.');}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{let disposed=false;async function load(){if(document.hidden||lock.current)return;try{await request(known.current&&current.current?'pulse':undefined);if(!disposed)setError('');}catch(e){if(!disposed)setError(e instanceof Error?e.message:'Panneau d’amis indisponible.');}}void load();const timer=setInterval(()=>void load(),15000);document.addEventListener('visibilitychange',load);return()=>{disposed=true;generation.current++;clearInterval(timer);document.removeEventListener('visibilitychange',load);};},[]);
 useEffect(()=>{if(known.current&&profile&&!lock.current)void request('pulse').catch(()=>{});},[profile?.name,JSON.stringify(profile?.avatar)]);
 return {data,error,busy,action};
}
export type FriendsController=ReturnType<typeof useFriends>;
