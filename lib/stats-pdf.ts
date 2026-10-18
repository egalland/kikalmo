import type {StatsData} from './stats';
import {THEMES} from './themes';
import logo from './stats-logo.json';
const BG='#f5eddc',INK='#30483b',MUTED='#727c62',SAGE='#dce4c6',GOLD='#b77b28',PANEL='#fff9ee',LINE='#d7cbb3';
const num=(v:number)=>Math.round(v||0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g,' ');
const day=(d:string)=>d.split('-').reverse().join('/');
const time=(ms:number)=>`${Math.floor(ms/60000)} min ${Math.floor(ms/1000)%60} s`;
const percent=(a:number,b:number)=>b?`${(100*a/b).toFixed(1).replace('.',',')} %`:'-';
const rgb=(hex:string)=>[1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(3)).join(' ');
const safe=(s:string)=>s.replace(/[\u202f\u00a0]/g,' ').replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/→/g,' au ').replace(/œ/g,'oe').replace(/Œ/g,'OE').replace(/…/g,'...').replace(/[^\x20-\xff]/g,'?');
const hexText=(s:string)=>Array.from(safe(s),c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
class PDF{
 pages:string[]=[];ops='';
 rect(x:number,y:number,w:number,h:number,fill:string,stroke?:string){this.ops+=`q ${rgb(fill)} rg ${stroke?rgb(stroke)+' RG .7 w':''} ${x} ${842-y-h} ${w} ${h} re ${stroke?'B':'f'} Q\n`;}
 line(x:number,y:number,w:number,color=LINE){this.ops+=`${rgb(color)} RG .7 w [2 3] 0 d ${x} ${842-y} m ${x+w} ${842-y} l S [] 0 d\n`;}
 text(x:number,y:number,s:string,size=10,bold=false,color=INK){this.ops+=`BT /${bold?'F2':'F1'} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${x} ${842-y-size} Tm <${hexText(s)}> Tj ET\n`;}
 start(subtitle:string,period:string){if(this.ops)this.pages.push(this.ops);this.ops='';this.rect(0,0,595,842,BG);this.ops+='q 215 0 0 55 34 751 cm /Logo Do Q\n';this.text(360,49,'LE CARNET DES STATISTIQUES',8,true,GOLD);this.line(34,106,527);this.text(34,125,subtitle,25,true);this.text(34,164,period,9,false,MUTED);}
 card(x:number,y:number,w:number,value:string,label:string,note=''){this.rect(x,y,w,86,SAGE,LINE);this.text(x+12,y+12,value,25,true);this.text(x+12,y+48,label,10,true);if(note)this.text(x+12,y+65,note,7,false,MUTED);}
 chart(x:number,y:number,w:number,title:string,rows:{label:string;values:number[]}[],labels:string[],colors:string[]){
 this.rect(x,y,w,190,PANEL,LINE);this.text(x+12,y+10,title,13,true);labels.forEach((label,i)=>this.text(x+12+i*100,y+33,label,8,false,colors[i]));
 const max=Math.max(2,Math.ceil(Math.max(0,...rows.flatMap(r=>r.values))/2)*2);const left=x+32,right=x+w-16,base=y+155,top=y+62;
 for(let j=0;j<3;j++){const yy=base-(base-top)*j/2;this.line(left,yy,right-left);this.text(x+5,yy-5,String(Math.round(max*j/2)),7,false,MUTED);}
 colors.forEach((color,k)=>{let path='';rows.forEach((r,i)=>{const xx=rows.length===1?(left+right)/2:left+(right-left)*i/Math.max(1,rows.length-1),yy=842-base+(base-top)*(r.values[k]||0)/max;path+=`${xx.toFixed(2)} ${yy.toFixed(2)} ${i?'l':'m'} `;if(rows.length===1)this.rect(xx-2,842-yy-2,4,4,color);});if(path)this.ops+=`${rgb(color)} RG 2 w ${path} S\n`;});
 if(rows.length){this.text(left,y+167,rows[0].label,7,false,MUTED);this.text(Math.max(left,right-53),y+167,rows[rows.length-1].label,7,false,MUTED);}else this.text(left,y+105,'Aucune activité enregistrée.',9,false,MUTED);
 }
 finish(){if(this.ops)this.pages.push(this.ops);const image=atob(logo.data);const objects:string[]=[];objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';objects[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';objects[5]=`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n${image}\nendstream`;
 const kids:number[]=[];this.pages.forEach((content,i)=>{const p=6+i*2,stream=p+1;kids.push(p);const footer=`BT /F1 8 Tf ${rgb(MUTED)} rg 1 0 0 1 34 27 Tm <${hexText('KIKALMO - STATISTIQUES')}> Tj 1 0 0 1 520 27 Tm (${i+1} / ${this.pages.length}) Tj ET\n`;content+=footer;objects[p]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Logo 5 0 R >> >> /Contents ${stream} 0 R >>`;objects[stream]=`<< /Length ${content.length} >>\nstream\n${content}endstream`;});objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(k=>`${k} 0 R`).join(' ')}] >>`;
 let out='%PDF-1.4\n%\xff\xff\xff\xff\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=out.length;out+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=out.length;out+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Uint8Array.from(out,c=>c.charCodeAt(0));
 }
}
export function statsPDF(d:StatsData){
 const pdf=new PDF();const c=(k:string)=>d.totals[k]?.count||0,t=(k:string)=>d.totals[k]?.total||0,m=(k:string)=>d.totals[k]?.max||0;
 const range=(d.from==='2000-01-01'?'Depuis le début':day(d.from))+' au '+day(d.to)+' - heure de Paris';
 const daily=d.series.map(s=>({label:day(s.day),values:[s.visitors,s.players]}));
 const game=d.series.map(s=>({label:day(s.day),values:[s.metrics.match_started?.count||0,s.metrics.match_completed?.count||0]}));
 pdf.start('Les chiffres de Kikalmo',range);
 const guesses=c('guess_correct')+c('guess_incorrect')+c('guess_close');
 const cards=[
 [d.visitorsSince?num(d.visitors.visitors):'-','Visiteurs uniques','Navigateurs ayant ouvert le jeu'],[num(d.players),'Joueurs uniques','Entrees dans les salons'],[num(d.sessions.sessions),'Sessions','Chaque entree dans un salon'],
 [num(c('match_started')),'Parties lancees',num(c('match_completed'))+' terminees'],[num(c('round_completed')),'Manches terminees',num(c('round_solved'))+' resolues'],[percent(c('guess_correct'),guesses),'Bonnes reponses',num(c('guess_correct'))+' / '+num(guesses)+' essais'],
 [time(d.sessions.activeMs),'Temps actif cumule','Sessions debutees sur la periode'],[c('solve_ms')?(t('solve_ms')/c('solve_ms')/1000).toFixed(1).replace('.',',')+' s':'-','Resolution moyenne','Bonnes reponses uniquement'],[num(m('concurrent')),'Pic simultane','Maximum observe en salon']
 ];cards.forEach(([v,l,note],i)=>pdf.card(34+(i%3)*180,200+Math.floor(i/3)*100,167,v,l,note));
 pdf.chart(34,516,257,'Visiteurs et joueurs',daily,['Visiteurs / jour','Joueurs / jour'],[GOLD,'#526c48']);pdf.chart(306,516,255,'Les parties',game,['Lancees','Terminees'],[GOLD,'#526c48']);
 pdf.text(34,724,'Un meme navigateur peut apparaitre plusieurs jours dans les courbes.',8,false,MUTED);
 pdf.text(34,740,'Les totaux uniques le dedupliquent sur toute la periode. Les tests sont inclus.',8,false,MUTED);
 pdf.text(34,754,'Jeu : '+(d.trackingSince?new Date(d.trackingSince).toLocaleDateString('fr-FR',{timeZone:'Europe/Paris'}):'-')+' - visites : '+(d.visitorsSince?new Date(d.visitorsSince).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}):'pas encore de suivi'),7,false,MUTED);
 pdf.text(34,770,'Releve : '+new Date(d.generatedAt).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}),8,false,MUTED);
 pdf.start('Dans les salons',range);
 const roomCols=[45,227,284,350,417,491];const headers=['Salon','Joueurs','Sessions','Lancees','Finies','Reponses'];pdf.rect(34,197,527,27,SAGE);headers.forEach((h,i)=>pdf.text(roomCols[i],205,h,9,true));
 d.rooms.forEach((r,i)=>{const y=232+i*26;pdf.text(45,y,(THEMES.find(t=>t.id===r.room)?.label||r.room).slice(0,28),9,true);[r.players,r.metrics.session_started?.count||0,r.metrics.match_started?.count||0,r.metrics.match_completed?.count||0,r.metrics.guess_correct?.count||0].forEach((v,j)=>pdf.text(roomCols[j+1],y,num(v),9));pdf.line(34,y+21,527);});
 let y=Math.max(290,240+d.rooms.length*26);pdf.text(34,y,'Les petits details',17,true);y+=35;
 const details=[['Meilleur score (parties terminees)',num(m('match_score'))],['Serie de bonnes reponses',num(m('streak'))],['Avant / apres indice',num(c('solve_before_hint'))+' / '+num(c('solve_after_hint'))],['Messages / emotes',num(c('chat'))+' / '+num(c('emote'))],['Points distribues',num(t('points'))]];
 details.forEach(([label,value],i)=>{pdf.text(36,y+i*23,label,10);pdf.text(433,y+i*23,value,10,true);});
 if(y+140>570)pdf.start('Les reponses',range);
 pdf.chart(34,y+140>570?210:Math.max(540,y+140),527,'Les reponses',d.series.map(r=>({label:day(r.day),values:[r.metrics.guess_correct?.count||0,r.metrics.guess_incorrect?.count||0,r.metrics.guess_close?.count||0]})),['Correctes','Incorrectes','Proches'],['#526c48','#ac6856',GOLD]);
 pdf.text(34,767,'La colonne Reponses compte uniquement les bonnes reponses.',8,false,MUTED);


 const sum=d.daily.reduce((a,r)=>({participants:a.participants+r.participants,solved:a.solved+r.solved,tries:a.tries+r.tries,errors:a.errors+r.errors}),{participants:0,solved:0,tries:0,errors:0});
 pdf.start('Un mot, chaque jour',range);
 [[num(sum.participants),'Participations'],[num(sum.solved),'Reussites'],[num(sum.tries),'Essais']].forEach(([v,l],i)=>pdf.card(34+i*180,200,167,v,l));
 pdf.chart(34,308,527,'La participation quotidienne',[...d.daily].reverse().map(r=>({label:day(r.day),values:[r.participants,r.solved]})),['Participants','Reussites'],[GOLD,'#526c48']);
 pdf.text(34,522,`${num(d.dailyPlayers)} navigateurs uniques - ${num(sum.errors)} erreurs`,11,true);
 const latest=d.daily[0]?.day;const winners=d.leaders.filter(l=>l.day===latest).slice(0,3);pdf.text(34,552,'Classement du '+(latest?day(latest):'-'),17,true);
 if(!winners.length)pdf.text(34,585,'Aucune reussite enregistree.',10,false,MUTED);
 winners.forEach((r,i)=>{const y=585+i*21;pdf.text(39,y,String(i+1),9,true);pdf.text(67,y,r.name.slice(0,40),10,true);pdf.text(358,y,`${r.tries} essai${r.tries>1?'s':''}`,9);pdf.text(477,y,new Date(r.solvedAt!).toLocaleTimeString('fr-FR',{timeZone:'Europe/Paris'}),9);});
 pdf.text(34,655,'Apercu : 3 meilleurs du dernier jour, parmi 200 reussites chargees sur la periode.',7,false,MUTED);
 const xs=[44,150,252,350,430,500];
 ['Date','Participants','Ont essaye','Reussites','Essais','Erreurs'].forEach((s,i)=>pdf.text(xs[i],677,s,8,true));
 d.daily.slice(0,3).forEach((r,i)=>{const y=699+i*21;[day(r.day),num(r.participants),num(r.tried),num(r.solved),num(r.tries),num(r.errors)].forEach((s,j)=>pdf.text(xs[j],y,s,9));pdf.line(34,y+17,527);});
 // Keep every day's summary in exports, even for long periods.
 for(let offset=3;offset<d.daily.length;offset+=20){pdf.start('Le journal du mot du jour',range);const xs=[44,150,252,350,430,500];['Date','Participants','Ont essaye','Reussites','Essais','Erreurs'].forEach((s,i)=>pdf.text(xs[i],205,s,9,true));d.daily.slice(offset,offset+20).forEach((r,i)=>{const y=240+i*24;[day(r.day),num(r.participants),num(r.tried),num(r.solved),num(r.tries),num(r.errors)].forEach((s,j)=>pdf.text(xs[j],y,s,9));pdf.line(34,y+19,527);});}
 // Source and measurement limitations accompany every export without adding an empty page.
 pdf.text(34,767,'Source : base Kikalmo. Tests inclus ; uniques = navigateurs. Dates : Europe/Paris.',7,false,MUTED);
 pdf.text(34,780,'Visites avant le debut du suivi : inconnues. Mot du jour compte separement.',7,false,MUTED);
 return pdf.finish();
}
