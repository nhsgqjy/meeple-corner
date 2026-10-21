import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  players: text("players").notNull(),
  minutes: integer("minutes").notNull(),
  complexity: text("complexity").notNull().default("轻松"),
  description: text("description").notNull().default(""),
  symbol: text("symbol").notNull().default("✦"),
  accent: text("accent").notNull().default("sage"),
  coverUrl: text("cover_url").notNull().default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const votes = sqliteTable(
  "votes",
  {
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.gameId, table.userId] })],
);

export const ratings = sqliteTable(
  "ratings",
  {
    gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    score: integer("score").notNull(),
    comment: text("comment").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.gameId, table.userId] })],
);

export const votingRounds = sqliteTable("voting_rounds", {
  id: text("id").primaryKey(), title: text("title").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), closedAt: text("closed_at"),
});
export const roundVotes = sqliteTable("round_votes", {
  roundId: text("round_id").notNull().references(() => votingRounds.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.roundId, table.userId, table.gameId] })]);
