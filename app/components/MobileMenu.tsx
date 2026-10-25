'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
import {Menu,X} from 'lucide-react';
/** Native disclosure: no modal focus trap, links and controls keep their usual keyboard behavior. */
export default function MobileMenu({children}:{children:ReactNode}){
 const root=useRef<HTMLDetailsElement>(null),id=useId();
 useEffect(()=>{
  const outside=(e:PointerEvent)=>{if(root.current&&!root.current.contains(e.target as Node))root.current.open=false;};
  const resized=()=>{if(window.innerWidth>900&&root.current)root.current.open=false;};
  document.addEventListener('pointerdown',outside);window.addEventListener('resize',resized);
  return()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',resized);};
 },[]);
 return <details ref={root} className="mobile-menu" onKeyDown={e=>{if(e.key==='Escape'&&root.current?.open){e.preventDefault();root.current.open=false;root.current.querySelector('summary')?.focus();}}}>
  <summary aria-label="Menu principal" aria-controls={id}><Menu className="menu-open-icon" size={20} aria-hidden="true"/><X className="menu-close-icon" size={20} aria-hidden="true"/><span>Menu</span></summary>
  <nav id={id} aria-label="Navigation principale" onClick={e=>{if((e.target as HTMLElement).closest('a,button')&&root.current)root.current.open=false;}}><a href="/compte" className="account-menu-link">Mon compte</a>{children}</nav>
 </details>;
}
