CREATE TABLE `direct_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	`read_at` integer
);
--> statement-breakpoint
CREATE INDEX `direct_messages_pair` ON `direct_messages` (`sender`,`recipient`,`created_at`);--> statement-breakpoint
CREATE INDEX `direct_messages_unread` ON `direct_messages` (`recipient`,`read_at`);