'use client';
import {useState} from 'react';
import {Check,Clock3,UserPlus} from 'lucide-react';
import type {FriendsController} from '../hooks/useFriends';
export default function RoomFriendButton({player,room,controller,onFriends}:{player:{id:string;name:string};room:string;controller:FriendsController;onFriends:()=>void}){
 const [code,setCode]=useState(''),[pending,setPending]=useState(false),[notice,setNotice]=useState('');
 const {data,action,busy,error}=controller,accepted=data.friends.some(f=>f.code===code),outgoing=data.outgoing.some(f=>f.code===code),incoming=data.incoming.some(f=>f.code===code);
 async function add(){if(pending||busy)return;setPending(true);setNotice('');try{if(!data.me&&!await action('register'))return;const result=await action('request-room',{room,target:player.id});if(result?.roomTarget){setCode(result.roomTarget.code);setNotice(result.friends.some(f=>f.code===result.roomTarget!.code)?'Vous êtes déjà amis.':result.incoming.some(f=>f.code===result.roomTarget!.code)?'Ce joueur vous a déjà envoyé une demande.':'Demande envoyée.');}}finally{setPending(false)}}
 return <div className="room-friend-action"><button type="button" disabled={pending||busy||outgoing||accepted} onClick={()=>incoming?onFriends():void add()} aria-label={accepted?'Déjà ami avec '+player.name:outgoing?'Demande envoyée à '+player.name:incoming?'Voir la demande de '+player.name:'Ajouter '+player.name+' en ami'} title={accepted?'Déjà amis':outgoing?'Demande envoyée':incoming?'Demande reçue':'Ajouter en ami'}>{accepted?<Check size={16}/>:outgoing?<Clock3 size={16}/>:<UserPlus size={16}/>}</button>{notice&&<span className="sr-only" role="status">{notice}</span>}{error&&notice===''&&code===''&&<span className="sr-only" role="alert">{error}</span>}</div>;
}
