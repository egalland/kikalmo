CREATE TABLE personal_events (player TEXT NOT NULL,id TEXT NOT NULL,day TEXT NOT NULL,room TEXT NOT NULL,kind TEXT NOT NULL,value REAL NOT NULL DEFAULT 0,at INTEGER NOT NULL,source TEXT NOT NULL DEFAULT 'live',PRIMARY KEY(player,id));
--> statement-breakpoint
CREATE INDEX personal_events_date ON personal_events(player,day);
--> statement-breakpoint
CREATE TABLE personal_sessions (player TEXT NOT NULL,id TEXT NOT NULL,room TEXT NOT NULL,started INTEGER NOT NULL,last_seen INTEGER NOT NULL,active_ms INTEGER NOT NULL,source TEXT NOT NULL DEFAULT 'live',PRIMARY KEY(player,id));
--> statement-breakpoint
CREATE TABLE personal_daily (player TEXT NOT NULL,id TEXT NOT NULL,day TEXT NOT NULL,tries INTEGER NOT NULL,solved_at INTEGER,at INTEGER NOT NULL,source TEXT NOT NULL DEFAULT 'live',PRIMARY KEY(player,id));
--> statement-breakpoint
CREATE TABLE player_stat_links (player TEXT PRIMARY KEY NOT NULL,vault TEXT NOT NULL,linked_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX player_stat_links_owner ON player_stat_links(vault);
--> statement-breakpoint
CREATE TABLE personal_stat_keys (id TEXT PRIMARY KEY NOT NULL,created_at INTEGER NOT NULL,last_seen INTEGER NOT NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO personal_events(player,id,day,room,kind,value,at)
 SELECT json_extract(e.value,'$.player'),c.id||'|'||e.key,json_extract(e.value,'$.day'),c.room,json_extract(e.value,'$.kind'),coalesce(json_extract(e.value,'$.value'),0),json_extract(e.value,'$.at') FROM analytics_commits c,json_each(c.events) e WHERE json_extract(e.value,'$.player') IS NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO personal_sessions SELECT player,id,room,started,last_seen,active_ms,'live' FROM analytics_sessions;
--> statement-breakpoint
CREATE TRIGGER personal_events_record AFTER INSERT ON analytics_commits BEGIN
 INSERT OR IGNORE INTO personal_events(player,id,day,room,kind,value,at)
 SELECT json_extract(value,'$.player'),NEW.id||'|'||key,json_extract(value,'$.day'),NEW.room,json_extract(value,'$.kind'),coalesce(json_extract(value,'$.value'),0),json_extract(value,'$.at') FROM json_each(NEW.events) WHERE json_extract(value,'$.player') IS NOT NULL;
 UPDATE player_stat_links SET linked_at=max(linked_at,NEW.at) WHERE player IN (SELECT json_extract(value,'$.player') FROM json_each(NEW.events) WHERE json_extract(value,'$.player') IS NOT NULL);
 UPDATE personal_stat_keys SET last_seen=max(last_seen,NEW.at) WHERE id IN (SELECT vault FROM player_stat_links WHERE player IN (SELECT json_extract(value,'$.player') FROM json_each(NEW.events)));
 DELETE FROM personal_events WHERE at<(unixepoch()-395*86400)*1000;
END;
--> statement-breakpoint
CREATE TRIGGER personal_session_insert AFTER INSERT ON analytics_sessions BEGIN
 UPDATE player_stat_links SET linked_at=max(linked_at,NEW.last_seen) WHERE player=NEW.player;
 UPDATE personal_stat_keys SET last_seen=max(last_seen,NEW.last_seen) WHERE id IN (SELECT vault FROM player_stat_links WHERE player=NEW.player);
 INSERT INTO personal_sessions(player,id,room,started,last_seen,active_ms) VALUES(NEW.player,NEW.id,NEW.room,NEW.started,NEW.last_seen,NEW.active_ms) ON CONFLICT(player,id) DO UPDATE SET last_seen=excluded.last_seen,active_ms=excluded.active_ms;
END;
--> statement-breakpoint
CREATE TRIGGER personal_session_update AFTER UPDATE ON analytics_sessions BEGIN
 UPDATE player_stat_links SET linked_at=max(linked_at,NEW.last_seen) WHERE player=NEW.player;
 UPDATE personal_stat_keys SET last_seen=max(last_seen,NEW.last_seen) WHERE id IN (SELECT vault FROM player_stat_links WHERE player=NEW.player);
 INSERT INTO personal_sessions(player,id,room,started,last_seen,active_ms) VALUES(NEW.player,NEW.id,NEW.room,NEW.started,NEW.last_seen,NEW.active_ms) ON CONFLICT(player,id) DO UPDATE SET last_seen=excluded.last_seen,active_ms=excluded.active_ms;
END;
--> statement-breakpoint
CREATE TRIGGER personal_daily_key_insert AFTER INSERT ON personal_daily BEGIN
 UPDATE player_stat_links SET linked_at=max(linked_at,NEW.at) WHERE player=NEW.player;
 UPDATE personal_stat_keys SET last_seen=max(last_seen,NEW.at) WHERE id IN (SELECT vault FROM player_stat_links WHERE player=NEW.player);
END;
--> statement-breakpoint
CREATE TRIGGER personal_daily_key_update AFTER UPDATE ON personal_daily BEGIN
 UPDATE player_stat_links SET linked_at=max(linked_at,NEW.at) WHERE player=NEW.player;
 UPDATE personal_stat_keys SET last_seen=max(last_seen,NEW.at) WHERE id IN (SELECT vault FROM player_stat_links WHERE player=NEW.player);
END;
