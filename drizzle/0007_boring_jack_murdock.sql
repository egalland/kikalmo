CREATE TABLE `economy_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`player` text NOT NULL,
	`currency` text NOT NULL,
	`delta` integer NOT NULL,
	`item` integer,
	`created_at` integer NOT NULL
);
