'use client';
import {useEffect,useState} from 'react';
import {ArrowLeft,Scissors} from 'lucide-react';
import CosmeticShop from '../components/CosmeticShop';
import ProfileEditor from '../components/ProfileEditor';
import MobileMenu from '../components/MobileMenu';
import Avatar from '../components/Avatar';
import {DEFAULT_AVATAR,PROFILE_KEY,parseProfile,type Profile} from '../../lib/profile';
import type {Wallet} from '../../lib/cosmetics';
export default function Boutique(){
 const [profile,setProfile]=useState<Profile|null>(null),[wallet,setWallet]=useState<Wallet|null>(null),[editing,setEditing]=useState(false),[error,setError]=useState('');
 async function loadWallet(){try{const r=await fetch('/api/economy');const d=await r.json() as Wallet&{error?:string};if(!r.ok)throw Error(d.error||'Collection indisponible.');setWallet(d);setError('');}catch(e){setError(e instanceof Error?e.message:'Collection indisponible.');}}
 useEffect(()=>{try{setProfile(parseProfile(localStorage.getItem(PROFILE_KEY)));}catch{}void loadWallet();},[]);
 async function save(p:Profile){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}catch{throw Error('La sauvegarde est bloquée par ce navigateur.');}setProfile(p);setEditing(false);void loadWallet();}
 return <main className="yarn-boutique"><header className="boutique-top"><a href="/" className="text-button"><ArrowLeft size={17}/> Retour aux salons</a><a href="/" className="boutique-wordmark">kikalmo<span>LA PETITE MERCERIE</span></a><button className="boutique-character" onClick={()=>setEditing(true)}><Avatar value={profile?.avatar||DEFAULT_AVATAR} animated={false}/><span>{profile?.name||'Mon personnage'}<small><Scissors size={12}/> Passer à l’atelier</small></span></button><MobileMenu><a href="/">Retour aux salons</a><button type="button" onClick={()=>setEditing(true)}>Mon personnage</button><a href="/statistiques">Mes statistiques</a></MobileMenu></header>
 <div className="mercerie-sign"><span aria-hidden="true"><Scissors size={22}/></span><p>Des mailles douces. Des idées un peu folles.</p></div>
 {error&&<p className="notice error" role="alert">{error} <button onClick={()=>void loadWallet()}>Réessayer</button></p>}
 <CosmeticShop avatar={profile?.avatar||DEFAULT_AVATAR} wallet={wallet} onWallet={setWallet} onCharacter={()=>setEditing(true)}/>
 <footer className="boutique-footer">Tricoté avec des mots, collectionné avec des victoires.<a href="/">Retourner jouer →</a></footer>
 {editing&&<ProfileEditor initial={profile} onSave={save} onCancel={()=>setEditing(false)} inRoom={false}/>}</main>;
}
