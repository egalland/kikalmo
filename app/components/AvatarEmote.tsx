'use client';
import Avatar from './Avatar';
import {type Avatar as AvatarData} from '../../lib/profile';
import {EMOTE_DETAILS} from '../../lib/emotes';
/** A reaction is the sender's complete puppet, with actual drawn expression frames. */
export default function AvatarEmote({avatar,emoji,name,preview=false}:{avatar?:AvatarData;emoji:string;name?:string;preview?:boolean}){
 const detail=EMOTE_DETAILS[emoji];if(!detail)return null;
 return <span className={'personal-emote'+(preview?' emote-preview':'')} role={preview?undefined:'status'} aria-label={preview?undefined:(name?name+' : ':'')+detail.label} aria-hidden={preview?true:undefined}>
  <Avatar value={avatar} emotion={emoji} animated={!preview}/>
  <span className={'emote-badge'+(emoji==='❤️'?' emote-heart':'')} aria-hidden="true">{detail.badge}</span>
 </span>;
}
