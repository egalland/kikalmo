export const LETTER_ROWS=['AZERTYUIOP','QSDFGHJKLM','WXCVBN'];
export const NUMBER_ROWS=['1234567890',"-'/.,:!?()",'&+@#'];
/** Edit at the input selection, including whole-answer replacement after a failed guess. */
export function keyboardEdit(value,key,start=value.length,end=start,maxLength=200){
 start=Math.max(0,Math.min(value.length,start??value.length));end=Math.max(start,Math.min(value.length,end??start));
 if(key==='BACKSPACE'&&start===end&&start>0){start-=Array.from(value.slice(0,start)).at(-1)?.length||1;}
 if(key==='DELETE'&&start===end&&end<value.length){end+=Array.from(value.slice(end))[0]?.length||1;}
 const insert=key==='BACKSPACE'||key==='DELETE'?'':key==='SPACE'?' ':key;
 const room=Math.max(0,maxLength-(value.length-(end-start)));
 let clipped='';for(const char of insert){if(clipped.length+char.length>room)break;clipped+=char;}
 return {value:value.slice(0,start)+clipped+value.slice(end),cursor:start+clipped.length};
}
