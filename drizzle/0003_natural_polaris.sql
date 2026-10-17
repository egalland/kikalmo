ALTER TABLE `daily_players` ADD `started_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `daily_players` ADD `last_seen` integer DEFAULT 0 NOT NULL;