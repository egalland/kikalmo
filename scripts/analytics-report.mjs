// Input: complete native Sites table exports, NOT a public HTTP endpoint.
// node scripts/analytics-report.mjs export.json [YYYY-MM-DD] [YYYY-MM-DD] [room]
import {readFileSync} from 'node:fs';
export function dailyReport(rows,from='0000-00-00',to='9999-99-99'){
 const records=(rows||[]).filter(r=>r.day>=from&&r.day<=to);
 const summarize=items=>{const played=items.filter(r=>r.tries>0),solved=played.filter(r=>r.solved_at!=null);const values=solved.map(r=>r.tries).sort((a,b)=>a-b);const errors=items.map(r=>JSON.parse(r.state).guesses.filter(g=>g.result!=='correct').length);const guesses=items.flatMap(r=>JSON.parse(r.state).guesses);return {participants:items.length,playersWhoTried:played.length,solved:solved.length,inProgress:played.length-solved.length,successRate:played.length?solved.length/played.length:null,guesses:guesses.length,incorrect:guesses.filter(g=>g.result!=='correct').length,close:guesses.filter(g=>g.result==='close').length,firstTry:solved.filter(r=>r.tries===1).length,solvedAttempts:{mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null,median:values.length?(values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2:null,best:values[0]??null},hintUnlocks:{first:errors.filter(n=>n>=3).length,second:errors.filter(n=>n>=6).length,vowel:errors.filter(n=>n>=9).length},solveHourParis:Object.fromEntries(Array.from({length:24},(_,h)=>[String(h).padStart(2,'0'),solved.filter(r=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(r.solved_at))===h).length]))};};
 return {uniqueBrowsers:new Set(records.map(r=>r.player)).size,...summarize(records),days:Object.fromEntries([...new Set(records.map(r=>r.day))].sort().map(day=>[day,summarize(records.filter(r=>r.day===day))])),caveats:['Participants = browser profiles opening the daily challenge; playersWhoTried excludes zero attempts.','Multiple days count participations; uniqueBrowsers is deduplicated across days.','In-progress puzzles remain retryable until Paris midnight; they are not confirmed abandonments.','No stopwatch or active-time metric; timestamps preserve when attempts and solves occurred.']};
}
export function report(data,from='0000-00-00',to='9999-99-99',room){
 const inRange=day=>day>=from&&day<=to;
 const commits=data.analytics_commits||[];
 const events=commits.filter(c=>!room||c.room===room||c.room==='technical').flatMap(c=>JSON.parse(c.events).map(e=>({...e,room:c.room}))).filter(e=>inRange(e.day));
 const days=(data.analytics_player_days||[]).filter(d=>inRange(d.day)&&(!room||d.room===room));
 const unique=rows=>new Set(rows.map(d=>d.player)).size;
 const counts={};for(const e of events)counts[e.kind]=(counts[e.kind]||0)+1;
 const values=kind=>events.filter(e=>e.kind===kind).map(e=>e.value).filter(Number.isFinite);
 const summary=items=>{const a=[...items].sort((a,b)=>a-b),n=a.length;return {count:n,mean:n?a.reduce((a,b)=>a+b,0)/n:null,median:n?(a[Math.floor((n-1)/2)]+a[Math.floor(n/2)])/2:null,max:n?a[n-1]:null};};
 const group=(items,key,fn)=>Object.fromEntries([...new Set(items.map(key))].sort().map(k=>[k,fn(items.filter(e=>key(e)===k))]));
 const players=new Map((data.analytics_players||[]).map(p=>[p.id,p]));
 const paris=at=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(at);
 const dailyPlayers=group(days,d=>d.day,rows=>{
  const ids=[...new Set(rows.map(r=>r.player))];const newcomers=ids.filter(id=>paris(players.get(id)?.first_seen||0)===rows[0].day).length;
  return {unique:ids.length,new:newcomers,returning:ids.length-newcomers};
 });
 const sessions=(data.analytics_sessions||[]).filter(s=>(!room||s.room===room)&&inRange(paris(s.started)));
 const wordStats=group(events.filter(e=>e.word),e=>e.word,rows=>({
  presented:rows.filter(e=>e.kind==='round_started').length,
  completed:rows.filter(e=>e.kind==='round_completed').length,
  solvedRounds:rows.filter(e=>e.kind==='round_solved').length,
  unsolvedRounds:rows.filter(e=>e.kind==='round_unsolved').length,
  solves:rows.filter(e=>e.kind==='guess_correct').length,
  guesses:rows.filter(e=>e.kind.startsWith('guess_')).length,
  solveMs:summary(rows.filter(e=>e.kind==='solve_ms').map(e=>e.value)),
 }));
 const nextDay=day=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
 const retention=group(days,d=>d.day,rows=>{const ids=new Set(rows.map(r=>r.player));const tomorrow=(data.analytics_player_days||[]).filter(d=>d.day===nextDay(rows[0].day)&&(!room||d.room===room));return {players:ids.size,returnedNextDay:new Set(tomorrow.filter(d=>ids.has(d.player)).map(d=>d.player)).size};});
 return {dailyWord:room?undefined:dailyReport(data.daily_players,from,to),period:{from,to,room:room||'all',timezone:'Europe/Paris'},trackingSince:commits.length?new Date(Math.min(...commits.map(c=>c.at))).toISOString():null,
 uniquePlayers:unique(days),dailyPlayers,counts,
 solveMs:summary(values('solve_ms')),firstSolveMs:summary(values('first_solve_ms')),
 matchDurationMs:summary(values('match_duration_ms')),roundDurationMs:summary(values('round_duration_ms')),
 scores:summary(values('match_score')),streaks:summary(values('streak')),
 matchStartingPlayers:summary(values('match_started')),
 roundStartingPlayers:summary(values('round_started')),
 sessionActiveMs:summary(sessions.map(s=>s.active_ms)),
 sessions:sessions.length,expiredWithoutExplicitLeave:sessions.filter(s=>!s.ended&&s.last_seen<Date.now()-12000).length,
 dailyRetainedPlayers:retention,
 attendanceByHour:group(events.filter(e=>e.kind==='presence'),e=>e.hour,rows=>({uniquePlayers:unique(rows),presenceSamples:rows.length})),
 playerActivity:group(events.filter(e=>e.player),e=>e.player,rows=>({rounds:rows.filter(e=>e.kind==='round_participation').length,matches:rows.filter(e=>e.kind==='match_participation').length,victories:rows.filter(e=>e.kind==='victory').length,firstSolves:rows.filter(e=>e.kind==='first_solve_ms').length})),
 roomActivity:group(events,e=>e.room,rows=>({matchesStarted:rows.filter(e=>e.kind==='match_started').length,matchesCompleted:rows.filter(e=>e.kind==='match_completed').length,roundsStarted:rows.filter(e=>e.kind==='round_started').length,uniquePlayers:unique(days.filter(d=>d.room===rows[0].room))})),
 emotes:group(events.filter(e=>e.kind==='emote'),e=>e.detail,rows=>rows.length),
 responseMs:summary(values('response_ms')),wordStats,
 observedDailyPeaks:(data.analytics_daily||[]).filter(r=>inRange(r.day)&&r.metric==='concurrent'),
 caveats:['Unique player = browser cookie, not a verified person.','Sessions cover game rooms, not passive lobby visits.','No automatic historical backfill.','Current/inactive sessions are inferred from last_seen after 12 seconds.','Next-day retention is provisional until the next day has ended.','Response timing samples include DB commit, exclude network and the metrics write itself.'],
 };
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){console.log(JSON.stringify(report(JSON.parse(readFileSync(process.argv[2],'utf8')),...process.argv.slice(3)),null,2));}
