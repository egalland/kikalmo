export const EMOTE_DETAILS:Record<string,{label:string;badge:string}>={
 '👏':{label:'Bravo',badge:'👏'},'😂':{label:'Mort de rire',badge:'HA !'},'🤔':{label:'Je réfléchis',badge:'?'},'🔥':{label:'En feu',badge:'🔥'},'🎉':{label:'C’est la fête',badge:'🎉'},'❤️':{label:'J’adore',badge:'♥'},'👍':{label:'Bien joué',badge:'👍'},'👎':{label:'Pas terrible',badge:'👎'},'🦆':{label:'Coin coin',badge:'COIN !'},'🐶':{label:'Ouaf ouaf',badge:'OUAF !'},
};
export function liveReaction<T extends {at:number}>(reaction:T|undefined,now:number):T|undefined{return reaction&&now-reaction.at<4500?reaction:undefined;}
