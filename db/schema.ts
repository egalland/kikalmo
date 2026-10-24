import { sqliteTable, text, integer, primaryKey, real, index } from 'drizzle-orm/sqlite-core';
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

// Short-lived HMAC pseudonyms, not raw IP addresses.
export const adminLoginLimits = sqliteTable('admin_login_limits', {
 id:text('id').primaryKey(), attempts:integer('attempts').notNull().default(0), expiresAt:integer('expires_at').notNull(),
});

export const personalEvents=sqliteTable('personal_events',{player:text('player').notNull(),id:text('id').notNull(),day:text('day').notNull(),room:text('room').notNull(),kind:text('kind').notNull(),value:real('value').notNull().default(0),at:integer('at').notNull(),source:text('source').notNull().default('live')},t=>[primaryKey({columns:[t.player,t.id]})]);
export const personalSessions=sqliteTable('personal_sessions',{player:text('player').notNull(),id:text('id').notNull(),room:text('room').notNull(),started:integer('started').notNull(),lastSeen:integer('last_seen').notNull(),activeMs:integer('active_ms').notNull(),source:text('source').notNull().default('live')},t=>[primaryKey({columns:[t.player,t.id]})]);
export const personalDaily=sqliteTable('personal_daily',{player:text('player').notNull(),id:text('id').notNull(),day:text('day').notNull(),tries:integer('tries').notNull(),solvedAt:integer('solved_at'),at:integer('at').notNull(),source:text('source').notNull().default('live')},t=>[primaryKey({columns:[t.player,t.id]})]);
export const playerStatLinks=sqliteTable('player_stat_links',{player:text('player').primaryKey(),vault:text('vault').notNull(),linkedAt:integer('linked_at').notNull()});

export const personalStatKeys=sqliteTable('personal_stat_keys',{id:text('id').primaryKey(),createdAt:integer('created_at').notNull(),lastSeen:integer('last_seen').notNull()});

// Functional progression: authoritative credits and one-time cosmetic purchases.
export const economyLedger=sqliteTable('economy_ledger',{
 id:text('id').primaryKey(),player:text('player').notNull(),currency:text('currency').notNull(),
 delta:integer('delta').notNull(),item:integer('item'),createdAt:integer('created_at').notNull(),
});

// Browser-bound social identities. Codes are public; raw player cookies never leave the server.
export const friendProfiles=sqliteTable('friend_profiles',{player:text('player').primaryKey(),code:text('code').notNull().unique(),name:text('name').notNull(),avatar:text('avatar').notNull(),seen:integer('seen').notNull(),visible:integer('visible').notNull().default(1)});
export const friendLinks=sqliteTable('friend_links',{requester:text('requester').notNull(),recipient:text('recipient').notNull(),status:text('status').notNull().default('pending'),createdAt:integer('created_at').notNull()},t=>[primaryKey({columns:[t.requester,t.recipient]}),index('friend_links_recipient').on(t.recipient,t.status)]);
export const friendBlocks=sqliteTable('friend_blocks',{owner:text('owner').notNull(),target:text('target').notNull()},t=>[primaryKey({columns:[t.owner,t.target]})]);

// Private, browser-bound conversations. Reads and writes require a current accepted friendship.
export const directMessages=sqliteTable('direct_messages',{
 id:text('id').primaryKey(),sender:text('sender').notNull(),recipient:text('recipient').notNull(),
 text:text('text').notNull(),createdAt:integer('created_at').notNull(),readAt:integer('read_at'),
},t=>[index('direct_messages_pair').on(t.sender,t.recipient,t.createdAt),index('direct_messages_unread').on(t.recipient,t.readAt)]);
