CREATE TABLE `site_visitor_days` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`visitor` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`views` integer DEFAULT 1 NOT NULL
);
