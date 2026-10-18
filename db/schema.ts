import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {id:text('id').primaryKey(), state:text('state').notNull(), revision:integer('revision').notNull().default(0)});

// Server-side telemetry. Reporting requires the admin session cookie.
export const analyticsCommits = sqliteTable('analytics_commits', {
 id:text('id').primaryKey(), at:integer('at').notNull(), day:text('day').notNull(),
 room:text('room').notNull(), events:text('events').notNull(),
});
export const analyticsDaily = sqliteTable('analytics_daily', {
 id:text('id').primaryKey(), day:text('day').notNull(), room:text('room').notNull(),
 metric:text('metric').notNull(), count:integer('count').notNull().default(0),
 total:integer('total').notNull().default(0), maximum:integer('maximum').notNull().default(0),
});
export const analyticsPlayers = sqliteTable('analytics_players', {
 id:text('id').primaryKey(), firstSeen:integer('first_seen').notNull(), lastSeen:integer('last_seen').notNull(),
});
export const analyticsPlayerDays = sqliteTable('analytics_player_days', {
 id:text('id').primaryKey(), day:text('day').notNull(), player:text('player').notNull(),
 room:text('room').notNull(), firstSeen:integer('first_seen').notNull(), lastSeen:integer('last_seen').notNull(),
});
export const analyticsSessions = sqliteTable('analytics_sessions', {
 id:text('id').primaryKey(), player:text('player').notNull(), room:text('room').notNull(),
 started:integer('started').notNull(), lastSeen:integer('last_seen').notNull(),
 activeMs:integer('active_ms').notNull().default(0), ended:integer('ended'), reason:text('reason'),
});

// Shared daily puzzle and browser-bound attempts. Never expose player identifiers.
export const dailyChallenges = sqliteTable('daily_challenges', {
 day:text('day').primaryKey(), question:text('question').notNull(),
});
export const dailyPlayers = sqliteTable('daily_players', {
 id:text('id').primaryKey(), day:text('day').notNull(), player:text('player').notNull(),
 name:text('name').notNull(), avatar:text('avatar').notNull(), state:text('state').notNull(),
 revision:integer('revision').notNull().default(0), tries:integer('tries').notNull().default(0),
 solvedAt:integer('solved_at'), startedAt:integer('started_at').notNull().default(0), lastSeen:integer('last_seen').notNull().default(0),
});

// Browser visits are separate from game room participation. No raw IP or user agent.
export const siteVisitorDays = sqliteTable('site_visitor_days', {
 id:text('id').primaryKey(), day:text('day').notNull(), visitor:text('visitor').notNull(),
 firstSeen:integer('first_seen').notNull(), lastSeen:integer('last_seen').notNull(),
 views:integer('views').notNull().default(1),
});
