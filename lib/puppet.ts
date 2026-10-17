/** Atlas coordinates are discrete, individually drawn images, never transformed poses. */
export function puppetFrames(time:number,seed:number,reacting=false){
 const frame=Math.floor(time/100);const cycle=((frame+seed)%70+70)%70;
 const eyes=cycle===50||cycle===53?1:cycle===51||cycle===52?2:cycle>=29&&cycle<=35?3:0;
 const mouth=reacting?[0,1,2,3][frame%4]:cycle>=10&&cycle<16?[0,1,2,3,1,0][cycle-10]:0;
 return {body:cycle>=20&&cycle<40?1:cycle>=40&&cycle<60?2:0,eyes,mouth};
}
export function atlasPosition(col:number,row:number,columns:number,rows:number){return {backgroundSize:`${columns*100}% ${rows*100}%`,backgroundPosition:`${columns>1?col/(columns-1)*100:0}% ${rows>1?row/(rows-1)*100:0}%`};}
export type PuppetExpression='idle'|'found'|'first'|'victory'|string;
export function playerExpression(phase:string,champion:string|undefined,player:{id:string;solved:boolean;solveRank?:number;reaction?:{text:string}}):PuppetExpression{
 if(phase==='podium'&&champion===player.id)return 'victory';
 if(player.reaction)return player.reaction.text;
 if(player.solved)return player.solveRank===1?'first':'found';
 return 'idle';
}
export const EXPRESSION_LABELS:Record<string,string>={found:'Content d’avoir trouvé',first:'Premier à trouver !',victory:'Victoire du match !'};
/** Select actual drawn eye/mouth frames; the shared 256px stage never changes size. */
export function puppetPose(eyes:number,mouth:number,expression:PuppetExpression,time:number,seed:number,moving=true){
 const idle=moving?puppetFrames(time,seed):{body:0,eyes:0,mouth:0};
 const f=moving?Math.floor(time/120)%8:0;
 const blink=idle.eyes===1||idle.eyes===2;
 switch(expression){
  case 'found':return {...idle,eyesRow:eyes,mouthRow:0,eyes:blink?idle.eyes:0,mouth:[1,1,0,0,0,0,1,1][f]};
  case 'first':return {...idle,eyesRow:2,mouthRow:1,eyes:blink?1:0,mouth:[3,2,3,1,3,2,3,1][f]};
  case 'victory':return {...idle,eyesRow:5,mouthRow:1,eyes:[0,0,2,0,0,0,2,0][f],mouth:[2,3,2,3,2,2,3,2][f]};
  case '😂':case '🎉':case '👏':return {...idle,eyesRow:5,mouthRow:1,eyes:0,mouth:[2,3,1,3,2,3,1,3][f]};
  case '👎':return {...idle,eyesRow:1,mouthRow:4,eyes:0,mouth:[0,1,0,3,0,1,0,3][f]};
  case '🤔':return {...idle,eyesRow:1,mouthRow:3,eyes:3,mouth:f%4===0?1:0};
  case '🦆':return {...idle,eyesRow:0,mouthRow:2,eyes:0,mouth:f%2===0?2:0};
  case '🐶':return {...idle,eyesRow:0,mouthRow:5,eyes:0,mouth:[2,3,1,0,2,3,1,0][f]};
  case '❤️':case '👍':return {...idle,eyesRow:5,mouthRow:0,eyes:0,mouth:f%3===0?3:1};
  case '🔥':return {...idle,eyesRow:2,mouthRow:1,eyes:0,mouth:f%2===0?2:3};
  default:return {...idle,eyesRow:eyes,mouthRow:mouth};
 }
}
export function feltColor(color:string){const filters:Record<string,string>={'#d8fc70':'hue-rotate(50deg) saturate(.7) brightness(1.12)','#c8b9ff':'hue-rotate(210deg) saturate(.5) brightness(1.2)','#ffae92':'hue-rotate(-20deg) saturate(.6) brightness(1.18)','#8fe1dd':'hue-rotate(130deg) saturate(.6) brightness(1.12)','#f8d779':'saturate(.85) brightness(1.04)','#ff8eb2':'hue-rotate(290deg) saturate(.65) brightness(1.12)','#80baff':'hue-rotate(165deg) saturate(.7) brightness(1.05)','#f2ede0':'saturate(.16) brightness(1.32)','#bfa1ff':'hue-rotate(215deg) saturate(.75) brightness(1.08)','#b5dd9b':'hue-rotate(65deg) saturate(.45) brightness(1.08)'};return filters[color]||'none';}
