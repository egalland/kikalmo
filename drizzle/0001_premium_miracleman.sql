CREATE TABLE `analytics_commits` (
	`id` text PRIMARY KEY NOT NULL,
	`at` integer NOT NULL,
	`day` text NOT NULL,
	`room` text NOT NULL,
	`events` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`room` text NOT NULL,
	`metric` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`maximum` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_player_days` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`player` text NOT NULL,
	`room` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_players` (
	`id` text PRIMARY KEY NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analytics_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`player` text NOT NULL,
	`room` text NOT NULL,
	`started` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`active_ms` integer DEFAULT 0 NOT NULL,
	`ended` integer,
	`reason` text
);
--> statement-breakpoint
CREATE INDEX analytics_commits_date ON analytics_commits(day,room);
--> statement-breakpoint
CREATE INDEX analytics_sessions_player ON analytics_sessions(player,started);
--> statement-breakpoint
CREATE TRIGGER analytics_rollup AFTER INSERT ON analytics_commits BEGIN
 INSERT INTO analytics_daily(id,day,room,metric,count,total,maximum)
 SELECT json_extract(e.value,'$.day')||'|'||NEW.room||'|'||json_extract(e.value,'$.kind'),
 json_extract(e.value,'$.day'),NEW.room,json_extract(e.value,'$.kind'),1,
 coalesce(json_extract(e.value,'$.value'),0),coalesce(json_extract(e.value,'$.value'),0)
 FROM json_each(NEW.events) e WHERE 1
 ON CONFLICT(id) DO UPDATE SET count=count+1,total=total+excluded.total,maximum=max(maximum,excluded.maximum);
 INSERT INTO analytics_daily(id,day,room,metric,count,total,maximum)
 SELECT json_extract(e.value,'$.day')||'|'||NEW.room||'|hour_'||json_extract(e.value,'$.hour'),
 json_extract(e.value,'$.day'),NEW.room,'hour_'||json_extract(e.value,'$.hour'),1,0,0
 FROM json_each(NEW.events) e WHERE json_extract(e.value,'$.kind')='presence'
 ON CONFLICT(id) DO UPDATE SET count=count+1;
 INSERT INTO analytics_players(id,first_seen,last_seen)
 SELECT json_extract(e.value,'$.player'),json_extract(e.value,'$.at'),json_extract(e.value,'$.at')
 FROM json_each(NEW.events) e WHERE json_extract(e.value,'$.kind')='presence'
 ON CONFLICT(id) DO UPDATE SET last_seen=max(last_seen,excluded.last_seen);
 INSERT INTO analytics_player_days(id,day,player,room,first_seen,last_seen)
 SELECT json_extract(e.value,'$.day')||'|'||NEW.room||'|'||json_extract(e.value,'$.player'),
 json_extract(e.value,'$.day'),json_extract(e.value,'$.player'),NEW.room,json_extract(e.value,'$.at'),json_extract(e.value,'$.at')
 FROM json_each(NEW.events) e WHERE json_extract(e.value,'$.kind')='presence'
 ON CONFLICT(id) DO UPDATE SET last_seen=max(last_seen,excluded.last_seen);
 INSERT INTO analytics_daily(id,day,room,metric,count,total,maximum)
 SELECT NEW.day||'|*|concurrent',NEW.day,'*','concurrent',1,0,
 count(DISTINCT json_extract(p.value,'$.id'))
 FROM rooms r,json_each(json_extract(r.state,'$.players')) p
 WHERE json_extract(p.value,'$.seen')>NEW.at-12000
 ON CONFLICT(id) DO UPDATE SET count=count+1,maximum=max(maximum,excluded.maximum);
 INSERT INTO analytics_daily(id,day,room,metric,count,total,maximum)
 SELECT NEW.day||'|'||NEW.room||'|occupancy',NEW.day,NEW.room,'occupancy',1,
 count(*),count(*) FROM rooms r,json_each(json_extract(r.state,'$.players')) p
 WHERE r.id=NEW.room AND json_extract(p.value,'$.seen')>NEW.at-12000
 ON CONFLICT(id) DO UPDATE SET count=count+1,total=total+excluded.total,maximum=max(maximum,excluded.maximum);
END;
