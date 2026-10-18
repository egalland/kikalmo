export function answerFeedback(result,{answer='',gain=0,rank=0,daily=false}={}){
 const quoted=answer.length>64?'« '+answer.slice(0,61)+'… »':'« '+answer+' »';
 switch(result){
  case 'incorrect':return {kind:'incorrect',title:'Incorrect',text:quoted+' — ce n’est pas la réponse. Réessaie.'};
  case 'close':return {kind:'close',title:'Tu es proche !',text:quoted+' — vérifie les lettres et réessaie.'};
  case 'correct':return {kind:'correct',title:daily?'Mot trouvé !':rank===1?'Premier à trouver !':'Bien joué !',text:daily?'Ta réussite est enregistrée.':`+${gain||0} points · réponse validée.`};
  case 'sent':return {kind:'neutral',title:'Message envoyé',text:'Ton message a été envoyé au salon.'};
  case 'sending':return {kind:'sending',title:'Vérification…',text:'Ta proposition est en cours d’envoi.'};
  case 'wait':return {kind:'neutral',title:'Pas de réponse validée',text:'La manche a changé ou tu as déjà trouvé.'};
  case 'rate':return {kind:'error',title:'Patiente un instant',text:'Ton message n’a pas été envoyé. Réessaie.'};
  case 'limit':return {kind:'error',title:'Essais terminés',text:'La limite de cette manche est atteinte.'};
  default:return {kind:'error',title:'Envoi impossible',text:'Aucune réponse n’a été validée. Réessaie.'};
 }
}
