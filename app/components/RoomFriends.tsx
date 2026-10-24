import type {Friend} from '../../lib/friends';
import Avatar from './Avatar';
export default function RoomFriends({friends}:{friends:Friend[]}){if(!friends.length)return null;return <span className="room-friends"><span className="room-friend-avatars">{friends.slice(0,3).map(friend=><span key={friend.code} title={friend.name}><Avatar value={friend.avatar} animated={false} label={friend.name}/></span>)}</span><span>{friends.length===1?friends[0].name+' est ici':friends.length+' amis ici'}</span></span>;}
