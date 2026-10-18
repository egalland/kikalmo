'use client';
import {useState,type RefObject,type KeyboardEvent} from 'react';
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
 if(!mobile)return null;
 if(!custom)return <div className="keyboard-mode-switch"><button type="button" onClick={()=>{input.current?.blur();onNative(false)}}>Utiliser le clavier Kikalmo</button></div>;
 const key=(label:string,token=label.toLowerCase())=><button type="button" key={label} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>applyKeyboardKey(token,value,onChange,input)} aria-label={label==='⌫'?'Effacer le caractère précédent':label}>{label}</button>;
 return <div className="mobile-keyboard" aria-label="Clavier Kikalmo"><div className="keyboard-toolbar"><span>CLAVIER KIKALMO</span><div>{onLast&&<button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={onLast}>Dernier essai</button>}<button type="button" onClick={()=>{input.current?.blur();onNative(true)}}>Clavier téléphone</button></div></div><div className="keyboard-keys">{(numbers?NUMBER_ROWS:LETTER_ROWS).map((row,i)=><div className="keyboard-row" key={i}>{Array.from(row).map(char=>key(char))}{i===2&&key('⌫','BACKSPACE')}</div>)}<div className="keyboard-row keyboard-bottom"><button type="button" disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>setNumbers(!numbers)} aria-label={numbers?'Afficher les lettres':'Afficher chiffres et ponctuation'}>{numbers?'ABC':'123'}</button><button type="button" disabled={disabled} className="keyboard-space" onMouseDown={e=>e.preventDefault()} onClick={()=>applyKeyboardKey('SPACE',value,onChange,input)}>Espace</button><button type="button" className="keyboard-submit" disabled={disabled||!value.trim()} onMouseDown={e=>e.preventDefault()} onClick={onSubmit}>{disabled?'…':'Valider ↵'}</button></div></div></div>;
}
