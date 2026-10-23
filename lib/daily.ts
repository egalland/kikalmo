import {mask,normalize,matchAnswer,type Question} from './game';
import clues from './question-clues.json';
export function dailyDate(now=Date.now()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export type DailyState={guesses:{id:string;text:string;result:string;at:number}[]};
export function dailyClues(q:Question,errors:number){const hints:string[]=[];if(errors>=3)hints.push(q.hint);if(errors>=6){const specific=('dailyHint' in q&&typeof q.dailyHint==='string'?q.dailyHint:undefined)||(clues as Record<string,string>)[q.theme+':'+normalize(q.answer)];hints.push(specific&&specific!==q.hint?specific:`La réponse commence par « ${q.answer[0].toUpperCase()} ».`);}return hints;}
export function dailyMasked(q:Question,errors:number){if(errors<9)return mask(q.answer);let shown=false;return q.answer.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/gi,'oe').replace(/æ/gi,'ae').replace(/[aeiouy]/gi,c=>{if(!shown){shown=true;return c;}return '';}).toUpperCase();}
export function dailyGuess(q:Question,answer:string,state:DailyState,id:string){if(state.guesses.some(g=>g.id===id))return state;return {guesses:[...state.guesses,{id,text:answer,result:matchAnswer(answer,q),at:Date.now()}]};}
