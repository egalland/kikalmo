import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {id:text('id').primaryKey(), state:text('state').notNull(), revision:integer('revision').notNull().default(0)});

// Private server-side telemetry. No public reporting route.
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
