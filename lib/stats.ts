import {calendar} from './analytics';
export type Metric={day:string;room:string;metric:string;count:number;total:number;maximum:number};
export type DailyResult={day:string;name:string;tries:number;solvedAt:number|null};
export type StatsData=Awaited<ReturnType<typeof readStats>>;
const isDay=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export function period(url:URL){const today=calendar(Date.now()).day;const from=url.searchParams.get('from')||'2000-01-01',to=url.searchParams.get('to')||today;if(!isDay(from)||!isDay(to)||from<'2000-01-01'||to>'2100-12-31'||from>to)throw Error('Choisis des dates valides, dans le bon ordre.');return {from,to};}
export function parisMidnight(day:string){
 const target=Date.parse(day+'T00:00:00Z');let at=target;
 for(let i=0;i<3;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(at);const n=(k:string)=>Number(parts.find(p=>p.type===k)!.value);at=target-(Date.UTC(n('year'),n('month')-1,n('day'),n('hour'),n('minute'),n('second'))-at);}
 return at;
}
export async function readStats(db:D1Database,from:string,to:string){
 const next=new Date(to+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const start=parisMidnight(from),end=parisMidnight(next.toISOString().slice(0,10));
 const statements=[
  db.prepare('SELECT day,room,metric,count,total,maximum FROM analytics_daily WHERE day BETWEEN ? AND ? ORDER BY day').bind(from,to),
  db.prepare('SELECT count(DISTINCT player) AS players FROM analytics_player_days WHERE day BETWEEN ? AND ?').bind(from,to),
  db.prepare('SELECT day,count(DISTINCT player) AS players FROM analytics_player_days WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day').bind(from,to),
  db.prepare('SELECT room,count(DISTINCT player) AS players FROM analytics_player_days WHERE day BETWEEN ? AND ? GROUP BY room').bind(from,to),
  db.prepare('SELECT count(*) AS sessions,coalesce(sum(active_ms),0) AS activeMs FROM analytics_sessions WHERE started >= ? AND started < ?').bind(start,end),
  db.prepare('SELECT day,count(DISTINCT visitor) AS visitors,sum(views) AS views FROM site_visitor_days WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day').bind(from,to),
  db.prepare('SELECT count(DISTINCT visitor) AS visitors,coalesce(sum(views),0) AS views FROM site_visitor_days WHERE day BETWEEN ? AND ?').bind(from,to),
  db.prepare('SELECT min(at) AS since FROM analytics_commits'),
  db.prepare('SELECT min(first_seen) AS since FROM site_visitor_days'),
  db.prepare('SELECT day,count(*) AS participants,sum(CASE WHEN tries>0 THEN 1 ELSE 0 END) AS tried,sum(CASE WHEN solved_at IS NOT NULL AND tries>0 THEN 1 ELSE 0 END) AS solved,coalesce(sum(tries),0) AS tries,coalesce(sum(CASE WHEN solved_at IS NOT NULL AND tries>0 THEN tries-1 ELSE tries END),0) AS errors FROM daily_players WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day DESC').bind(from,to),
  db.prepare('SELECT day,name,tries,solved_at AS solvedAt FROM daily_players WHERE day BETWEEN ? AND ? AND tries>0 AND solved_at IS NOT NULL ORDER BY day DESC,tries,solved_at LIMIT 200').bind(from,to),
  db.prepare('SELECT count(DISTINCT player) AS players FROM daily_players WHERE day BETWEEN ? AND ?').bind(from,to),
 ];
 const r=await db.batch(statements);const metrics=r[0].results as Metric[];const aggregate=(items:Metric[])=>{const out:Record<string,{count:number;total:number;max:number}>={};for(const m of items){const a=out[m.metric]??={count:0,total:0,max:0};a.count+=m.count;a.total+=m.total;a.max=Math.max(a.max,m.maximum);}return out;};
 const totals=aggregate(metrics);const dailyPlayers=r[2].results as {day:string;players:number}[];const visits=r[5].results as {day:string;visitors:number;views:number}[];
 const dates=[...new Set([...metrics.map(m=>m.day),...dailyPlayers.map(r=>r.day),...visits.map(r=>r.day)])].sort();
 const series=dates.map(day=>({day,players:dailyPlayers.find(x=>x.day===day)?.players||0,visitors:visits.find(x=>x.day===day)?.visitors||0,views:visits.find(x=>x.day===day)?.views||0,metrics:aggregate(metrics.filter(x=>x.day===day))}));
 const rooms=(r[3].results as {room:string;players:number}[]).map(row=>({...row,metrics:aggregate(metrics.filter(x=>x.room===row.room))}));
 return {from,to,generatedAt:Date.now(),trackingSince:(r[7].results[0] as any)?.since as number|null,visitorsSince:(r[8].results[0] as any)?.since as number|null,players:Number((r[1].results[0] as any)?.players||0),sessions:r[4].results[0] as {sessions:number;activeMs:number},visitors:r[6].results[0] as {visitors:number;views:number},totals,series,rooms,daily:r[9].results as {day:string;participants:number;tried:number;solved:number;tries:number;errors:number}[],leaders:r[10].results as DailyResult[],dailyPlayers:Number((r[11].results[0] as any)?.players||0)};
}
