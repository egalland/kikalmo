CREATE TABLE `player_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter` text NOT NULL,
	`kind` text NOT NULL,
	`room` text NOT NULL,
	`item_key` text NOT NULL,
	`reason` text NOT NULL,
	`detail` text NOT NULL,
	`context` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `player_reports_created` ON `player_reports` (`created_at`);