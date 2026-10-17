CREATE TABLE `daily_challenges` (
	`day` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_players` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`player` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`tries` integer DEFAULT 0 NOT NULL,
	`solved_at` integer
);
