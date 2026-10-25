'use client';
import {useAccount} from '../components/AccountProvider';
import {useEffect,useState} from 'react';
import {ArrowLeft,Scissors} from 'lucide-react';
import CosmeticShop from '../components/CosmeticShop';
import ProfileEditor from '../components/ProfileEditor';
import MobileMenu from '../components/MobileMenu';
import MenuRooms from '../components/MenuRooms';
import FriendsPanel from '../components/FriendsPanel';
import PrivateMessenger from '../components/PrivateMessenger';
import useFriends from '../hooks/useFriends';
import Avatar from '../components/Avatar';
import AnimatedLogo from '../components/AnimatedLogo';
import {DEFAULT_AVATAR,PROFILE_KEY,parseProfile,type Profile} from '../../lib/profile';
import type {Wallet} from '../../lib/cosmetics';
export default function Boutique(){
 const account=useAccount();
 const [profile,setProfile]=useState<Profile|null>(null),[wallet,setWallet]=useState<Wallet|null>(null),[editing,setEditing]=useState(false),[error,setError]=useState('');
 const friends=useFriends(profile),[friendsOpen,setFriendsOpen]=useState(false),[privateOpen,setPrivateOpen]=useState(false),[privatePeer,setPrivatePeer]=useState('');
 function openPrivate(code:string){setPrivatePeer(code);setPrivateOpen(true);setFriendsOpen(false);}
 async function loadWallet(){try{const r=await fetch('/api/economy');const d=await r.json() as Wallet&{error?:string};if(!r.ok)throw Error(d.error||'Collection indisponible.');setWallet(d);setError('');}catch(e){setError(e instanceof Error?e.message:'Collection indisponible.');}}
 useEffect(()=>{if(account.ready){setProfile(account.profile);void loadWallet();}},[account.ready,JSON.stringify(account.profile)]);
 async function save(p:Profile,revision?:number){p=await account.save(p,revision);try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}catch{throw Error('La sauvegarde est bloquée par ce navigateur.');}setProfile(p);setEditing(false);void loadWallet();}
 return <main className="yarn-boutique"><header className="boutique-top"><a href="/" className="text-button"><ArrowLeft size={17}/> Retour aux salons</a><a href="/" className="boutique-wordmark"><AnimatedLogo/></a><button className="boutique-character" onClick={()=>setEditing(true)}><Avatar value={profile?.avatar||DEFAULT_AVATAR} animated={false}/><span>{profile?.name||'Mon personnage'}<small><Scissors size={12}/> Passer à l’atelier</small></span></button><MobileMenu><a href="/">Retour aux salons</a><button type="button" onClick={()=>setEditing(true)}>Mon personnage</button><button type="button" onClick={()=>setFriendsOpen(true)}>Mes amis</button><a href="/statistiques">Mes statistiques</a><MenuRooms friends={friends.data.friends}/></MobileMenu></header>
 {error&&<p className="notice error" role="alert">{error} <button onClick={()=>void loadWallet()}>Réessayer</button></p>}
 <CosmeticShop avatar={profile?.avatar||DEFAULT_AVATAR} wallet={wallet} onWallet={setWallet} onCharacter={()=>setEditing(true)}/>
 <footer className="boutique-footer"><a href="/">Retourner jouer →</a></footer>
 <PrivateMessenger controller={friends} profile={profile} open={privateOpen} onOpen={setPrivateOpen} selectedCode={privatePeer} onSelect={setPrivatePeer} onFriends={()=>setFriendsOpen(true)} onProfile={()=>setEditing(true)}/>{friendsOpen&&<FriendsPanel onChat={openPrivate} controller={friends} profile={profile} currentRoom="" onClose={()=>setFriendsOpen(false)} onProfile={()=>setEditing(true)} onJoin={id=>{window.location.assign('/?room='+id);}}/>}{editing&&<ProfileEditor accountRevision={account.connected?account.revision:undefined} initial={profile} onSave={save} onCancel={()=>setEditing(false)} inRoom={false}/>}</main>;
}
