CREATE TABLE `round_votes` (
	`round_id` text NOT NULL,
	`user_id` text NOT NULL,
	`game_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`round_id`, `user_id`),
	FOREIGN KEY (`round_id`) REFERENCES `voting_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `voting_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`closed_at` text
);
--> statement-breakpoint
ALTER TABLE `games` ADD `cover_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `featured` integer DEFAULT false NOT NULL;