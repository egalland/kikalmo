'use client';
import {useEffect,useState,type RefObject,type KeyboardEvent} from 'react';
import {LETTER_ROWS,NUMBER_ROWS,keyboardEdit} from '../../lib/mobile-keyboard.mjs';
export function applyKeyboardKey(key:string,value:string,onChange:(s:string)=>void,input:RefObject<HTMLInputElement|null>){
 const field=input.current,next=keyboardEdit(value,key,field?.selectionStart??value.length,field?.selectionEnd??value.length);
 onChange(next.value);requestAnimationFrame(()=>{input.current?.focus({preventScroll:true});input.current?.setSelectionRange(next.cursor,next.cursor);});
}
export function physicalSiteKey(e:KeyboardEvent<HTMLInputElement>,value:string,onChange:(s:string)=>void,input:RefObject<HTMLInputElement|null>){
 if(e.nativeEvent.isComposing||e.ctrlKey||e.metaKey||e.altKey)return false;
 const key=e.key==='Backspace'?'BACKSPACE':e.key==='Delete'?'DELETE':Array.from(e.key).length===1?e.key:null;
 if(!key)return false;e.preventDefault();applyKeyboardKey(key,value,onChange,input);return true;
}
export default function MobileKeyboard({mobile,custom,value,onChange,onSubmit,onNative,input,disabled=false,onLast}:{mobile:boolean;custom:boolean;value:string;onChange:(s:string)=>void;onSubmit:()=>void;onNative:(native:boolean)=>void;input:RefObject<HTMLInputElement|null>;disabled?:boolean;onLast?:()=>void}){
 const [numbers,setNumbers]=useState(false);
 const [haptics,setHaptics]=useState(true),[supportsHaptics,setSupportsHaptics]=useState(false);
 useEffect(()=>{
  setSupportsHaptics(typeof navigator.vibrate==='function');
  const load=()=>{try{setHaptics(localStorage.getItem('kikalmo-keyboard-haptics')!=='off')}catch{}};
  load();window.addEventListener('kikalmo-keyboard-haptics',load);window.addEventListener('storage',load);
  return()=>{window.removeEventListener('kikalmo-keyboard-haptics',load);window.removeEventListener('storage',load);};
 },[]);
 // Keep feedback inside a user gesture; unavailable or blocked vibration must never interrupt typing.
 const vibrate=(enabled=haptics)=>{if(enabled&&typeof navigator!=='undefined'&&typeof navigator.vibrate==='function'){try{navigator.vibrate(10)}catch{}}};
 const toggleHaptics=()=>{const next=!haptics;setHaptics(next);try{localStorage.setItem('kikalmo-keyboard-haptics',next?'on':'off');window.dispatchEvent(new Event('kikalmo-keyboard-haptics'));}catch{}vibrate(next);};
 const press=(action:()=>void)=>{vibrate();action();};
 if(!mobile)return null;
 if(!custom)return <div className="keyboard-mode-switch"><button type="button" onClick={()=>{input.current?.blur();onNative(false)}}>Utiliser le clavier Kikalmo</button></div>;
 const key=(label:string,token=label.toLowerCase())=><button type="button" key={label} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>press(()=>applyKeyboardKey(token,value,onChange,input))} aria-label={label==='⌫'?'Effacer le caractère précédent':label}>{label}</button>;
 return <div className="mobile-keyboard" aria-label="Clavier Kikalmo"><div className="keyboard-toolbar"><span>CLAVIER KIKALMO</span><div>{supportsHaptics&&<button type="button" aria-pressed={haptics} aria-label="Vibrations du clavier" title={haptics?"Désactiver les vibrations":"Activer les vibrations"} onMouseDown={e=>e.preventDefault()} onClick={toggleHaptics}>Vibrations {haptics?"oui":"non"}</button>}{onLast&&<button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>press(onLast)}>Dernier essai</button>}<button type="button" onClick={()=>{input.current?.blur();onNative(true)}}>Clavier téléphone</button></div></div><div className="keyboard-keys">{(numbers?NUMBER_ROWS:LETTER_ROWS).map((row,i)=><div className="keyboard-row" key={i}>{Array.from(row).map(char=>key(char))}{i===2&&key('⌫','BACKSPACE')}</div>)}<div className="keyboard-row keyboard-bottom"><button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>press(()=>setNumbers(!numbers))} aria-label={numbers?'Afficher les lettres':'Afficher chiffres et ponctuation'}>{numbers?'ABC':'123'}</button><button type="button" disabled={disabled} className="keyboard-space" onMouseDown={e=>e.preventDefault()} onClick={()=>press(()=>applyKeyboardKey('SPACE',value,onChange,input))}>Espace</button><button type="button" className="keyboard-submit" disabled={disabled||!value.trim()} onMouseDown={e=>e.preventDefault()} onClick={()=>press(onSubmit)}>{disabled?'…':'Valider ↵'}</button></div></div></div>;
}
