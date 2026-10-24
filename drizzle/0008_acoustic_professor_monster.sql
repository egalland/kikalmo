CREATE TABLE `friend_blocks` (
	`owner` text NOT NULL,
	`target` text NOT NULL,
	PRIMARY KEY(`owner`, `target`)
);
--> statement-breakpoint
CREATE TABLE `friend_links` (
	`requester` text NOT NULL,
	`recipient` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`requester`, `recipient`)
);
--> statement-breakpoint
CREATE INDEX `friend_links_recipient` ON `friend_links` (`recipient`,`status`);--> statement-breakpoint
CREATE TABLE `friend_profiles` (
	`player` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`seen` integer NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_profiles_code_unique` ON `friend_profiles` (`code`);