// Stable ties preserve the theme order, without mutating the server snapshot.
export function sortRooms(rooms) {
  return rooms.map((room,index)=>({room,index})).sort((a,b)=>(b.room.count||0)-(a.room.count||0)||a.index-b.index).map(({room})=>room);
}
