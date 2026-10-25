CREATE TABLE `account_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`player` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `account_sessions_player` ON `account_sessions` (`player`);--> statement-breakpoint
CREATE TABLE `player_accounts` (
	`player` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`vault` text NOT NULL,
	`profile` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_key_hash_unique` ON `player_accounts` (`key_hash`);