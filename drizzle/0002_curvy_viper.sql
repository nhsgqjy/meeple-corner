PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_round_votes` (
	`round_id` text NOT NULL,
	`user_id` text NOT NULL,
	`game_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`round_id`, `user_id`, `game_id`),
	FOREIGN KEY (`round_id`) REFERENCES `voting_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_round_votes`("round_id", "user_id", "game_id", "created_at") SELECT "round_id", "user_id", "game_id", "created_at" FROM `round_votes`;--> statement-breakpoint
DROP TABLE `round_votes`;--> statement-breakpoint
ALTER TABLE `__new_round_votes` RENAME TO `round_votes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;