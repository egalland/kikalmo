'use client';
import {useState} from 'react';
import {Clock3,MoreHorizontal,UserPlus} from 'lucide-react';
import type {FriendsController} from '../hooks/useFriends';
export default function RoomFriendButton({player,room,controller,onFriends,onChat}:{player:{id:string;name:string};room:string;controller:FriendsController;onFriends:()=>void;onChat?:(code:string)=>void}){
 const [pending,setPending]=useState(false),[notice,setNotice]=useState('');
 const {data,action,busy,ready}=controller,friend=data.friends.find(f=>f.playerKey===player.id),outgoing=data.outgoing.find(f=>f.playerKey===player.id),incoming=data.incoming.find(f=>f.playerKey===player.id),blocked=data.blocked.find(f=>f.playerKey===player.id);
 async function act(block=false){if(pending||busy)return;setPending(true);setNotice('');try{if(!data.me&&!await action('register'))return;const result=await action(block?'block-room':'request-room',{room,target:player.id});if(result)setNotice(block?'Joueur bloqué.':'Demande envoyée.');}finally{setPending(false)}}
 if(!ready)return null;
 return <div className="room-friend-action">{!friend&&!blocked&&(outgoing?<span className="room-request-sent" title="Demande envoyée"><Clock3 size={16}/><span className="sr-only">Demande envoyée à {player.name}</span></span>:<button type="button" disabled={pending||busy} onClick={()=>incoming?onFriends():void act()} aria-label={incoming?'Voir la demande de '+player.name:'Ajouter '+player.name+' en ami'} title={incoming?'Demande reçue':'Ajouter en ami'}><UserPlus size={16}/></button>)}<details className="room-player-menu"><summary aria-label={'Options pour '+player.name}><MoreHorizontal size={16}/></summary><div>{friend&&onChat&&<button type="button" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');onChat(friend.code);}}>Message privé</button>}{blocked?<button type="button" disabled={busy} onClick={()=>void action('unblock',{code:blocked.code})}>Débloquer</button>:<button type="button" disabled={pending||busy} onClick={()=>void act(true)}>Bloquer {player.name}</button>}</div></details>{notice&&<span className="sr-only" role="status">{notice}</span>}</div>;
}
