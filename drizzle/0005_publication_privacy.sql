CREATE TABLE admin_login_limits (id TEXT PRIMARY KEY NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX admin_login_limits_expiry ON admin_login_limits(expires_at);
--> statement-breakpoint
DELETE FROM analytics_commits;
--> statement-breakpoint
DELETE FROM analytics_sessions;
--> statement-breakpoint
DELETE FROM analytics_player_days;
--> statement-breakpoint
DELETE FROM analytics_players;
--> statement-breakpoint
DELETE FROM site_visitor_days;
--> statement-breakpoint
UPDATE rooms SET state=json_set(state,'$.players',json(coalesce((SELECT json_group_array(json_remove(value,'$.tracking')) FROM json_each(json_extract(rooms.state,'$.players'))),'[]'))), revision=revision+1;
--> statement-breakpoint
UPDATE rooms SET state=json_set(state,'$.vacancy.players',json(coalesce((SELECT json_group_array(json_remove(value,'$.tracking')) FROM json_each(json_extract(rooms.state,'$.vacancy.players'))),'[]'))), revision=revision+1 WHERE json_type(state,'$.vacancy')='object';
--> statement-breakpoint
CREATE TRIGGER privacy_daily_retention AFTER INSERT ON daily_players BEGIN
 DELETE FROM daily_players WHERE day < date('now','-30 days');
 DELETE FROM daily_challenges WHERE day < date('now','-30 days');
END;
--> statement-breakpoint
CREATE TRIGGER privacy_analytics_retention AFTER INSERT ON analytics_commits BEGIN
 DELETE FROM analytics_commits WHERE at < (unixepoch()-90*86400)*1000;
 DELETE FROM analytics_sessions WHERE last_seen < (unixepoch()-90*86400)*1000;
 DELETE FROM analytics_player_days WHERE day < date('now','-90 days');
 DELETE FROM analytics_players WHERE last_seen < (unixepoch()-90*86400)*1000;
 DELETE FROM analytics_daily WHERE day < date('now','-395 days');
END;
--> statement-breakpoint
CREATE TRIGGER privacy_visit_retention AFTER INSERT ON site_visitor_days BEGIN
 DELETE FROM site_visitor_days WHERE day < date('now','-90 days');
END;
