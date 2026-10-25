'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {PROFILE_KEY,parseProfile,type Profile} from '../../lib/profile';
type State={connected:boolean;profile:Profile|null;revision:number;devices:number;hasKey:boolean};
const initial:State={connected:false,profile:null,revision:0,devices:0,hasKey:false};
type Controller=State&{ready:boolean;error:string;refresh:()=>Promise<void>;save:(profile:Profile,revision?:number)=>Promise<Profile>;act:(action:string,extra?:Record<string,unknown>)=>Promise<{key?:string}>};
const stateOnly=(s:State):State=>({connected:s.connected,profile:s.profile,revision:s.revision,devices:s.devices,hasKey:s.hasKey});
const Context=createContext<Controller|null>(null);
export const useAccount=()=>{const c=useContext(Context);if(!c)throw Error('Compte indisponible');return c;};
function cached(){try{return parseProfile(localStorage.getItem(PROFILE_KEY));}catch{return null;}}
function store(profile:Profile|null){try{if(profile)localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));else localStorage.removeItem(PROFILE_KEY);}catch{}}
export default function AccountProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(initial),[ready,setReady]=useState(false),[error,setError]=useState('');const current=useRef(state),serial=useRef(0);current.current=state;
 const refresh=useCallback(async()=>{const mine=++serial.current;try{const r=await fetch('/api/account',{cache:'no-store'}),d=await r.json() as State&{error?:string;key?:string;restoredGuest?:boolean};if(!r.ok)throw Error(d.error);if(mine!==serial.current)return;const ended=current.current.connected&&!d.connected;const profile=d.connected?d.profile:ended?null:cached();if(ended)store(null);setState({...stateOnly(d),profile});if(d.connected)store(profile);setError(ended?'Votre session a pris fin. Ouvrez Mon compte pour la récupérer.':'');}catch(e){if(mine!==serial.current)return;setError(e instanceof Error?e.message:'Compte indisponible.');setState(s=>({...s,profile:s.profile||cached()}));}finally{if(mine===serial.current)setReady(true);}},[]);
 useEffect(()=>{void refresh();const visible=()=>{if(!document.hidden)void refresh();};const timer=setInterval(visible,30000);document.addEventListener('visibilitychange',visible);return()=>{serial.current++;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[refresh]);
 async function act(action:string,extra:Record<string,unknown>={}){
  serial.current++;
  if(action==='import'&&!current.current.connected){try{localStorage.setItem('kikalmo-guest-profile',JSON.stringify(cached()));}catch{}}
  const r=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...extra})}),d=await r.json() as State&{error?:string;key?:string;restoredGuest?:boolean};
  serial.current++;
  if(!r.ok){if(r.status===409&&d.connected){setState(stateOnly(d));store(d.profile);}throw Error(d.error||'Opération impossible.');}
  if(action==='logout'){let guest:Profile|null=null;if(d.restoredGuest){try{guest=parseProfile(localStorage.getItem('kikalmo-guest-profile'));}catch{}}store(guest);setState({...initial,profile:guest});}
  else if(typeof d.connected==='boolean'){setState(stateOnly(d));store(d.profile);}
  setError('');return d;
 }
 async function save(profile:Profile,revision?:number){
  if(revision!==undefined&&!current.current.connected)throw Error('Votre session a pris fin. Reconnectez le compte avant d’enregistrer ce personnage.');
  if(current.current.connected){const d=await act('profile',{profile,revision:revision??current.current.revision}) as unknown as State;return d.profile!;}
  if(error)throw Error('Impossible de vérifier le compte. Réessayez avant de modifier votre personnage.');
  store(profile);setState(s=>({...s,profile}));return profile;
 }
 return <Context.Provider value={{...state,ready,error,refresh,save,act}}>{children}</Context.Provider>;
}
