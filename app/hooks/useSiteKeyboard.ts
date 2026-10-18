'use client';
import {useEffect,useState,useSyncExternalStore} from 'react';
const query='(max-width: 900px)';
const subscribe=(f:()=>void)=>{const media=window.matchMedia(query);media.addEventListener('change',f);return()=>media.removeEventListener('change',f);};
const snapshot=()=>window.matchMedia(query).matches;
export default function useSiteKeyboard(enabled:boolean){
 const mobile=useSyncExternalStore(subscribe,snapshot,()=>false);
 const [native,setNativeState]=useState(false);
 useEffect(()=>{const load=()=>{try{setNativeState(localStorage.getItem('kikalmo-keyboard')==='native')}catch{}};load();window.addEventListener('kikalmo-keyboard',load);return()=>window.removeEventListener('kikalmo-keyboard',load);},[]);
 const setNative=(value:boolean)=>{setNativeState(value);try{localStorage.setItem('kikalmo-keyboard',value?'native':'site');window.dispatchEvent(new Event('kikalmo-keyboard'));}catch{}};
 return {mobile,custom:enabled&&mobile&&!native,setNative};
}
