import {
	boolean,
	date,
	pgTable,
	serial,
	timestamp,
	varchar,
	integer,
	type AnyPgColumn,
	primaryKey,
	text,
	uuid,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';

export const users = pgTable('users', {
	id: text('id').primaryKey(),
	username: varchar('username', { length: 60 }).notNull(),
	handle: varchar('handle', { length: 32 }).notNull().unique(),
	bio: varchar('bio', { length: 256 }).default('Nothing here yet...'),
	created_at: timestamp('created_at').defaultNow(),
	banned: boolean('banned').default(false),
	token: text('token').default('a'),
	email: text('email').notNull(),
	verified: integer('verified')
		.references(() => badges.id)
		.default(1),
	updated: timestamp('updated').defaultNow()
});

export const vorps = pgTable('vorps', {
	id: text('id').primaryKey(),
	user_id: text('user_id').references(() => users.id),
	content: text('content').notNull(),
	views: integer('views').default(0),
	shares: integer('shares').default(0),
	created_at: timestamp('created_at').defaultNow(),
	parent: text('parent').references((): AnyPgColumn => vorps.id),
	edited: boolean('edited').default(false),
	hasImage: boolean('hasImage').default(false)
});

export const followers = pgTable(
	'followers',
	{
		user_id: text('user_id')
			.references(() => users.id)
			.notNull(),
		follower_id: text('follower_id')
			.references(() => users.id)
			.notNull()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.user_id, table.follower_id], name: 'followers_pkey' })
		};
	}
);

export const likes = pgTable(
	'likes',
	{
		vorp_id: text('vorp_id')
			.references(() => vorps.id)
			.notNull(),
		user_id: text('user_id')
			.references(() => users.id)
			.notNull(),
		liked_at: timestamp('liked_at').defaultNow()
	},
	(table) => {
		return {
			pk: primaryKey({ columns: [table.vorp_id, table.user_id], name: 'likes_pkey' })
		};
	}
);

export const notifications = pgTable('notifications', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	type: text('type').notNull(),
	sourceUserId: text('source_user_id').references(() => users.id),
	vorpId: text('vorp_id').references(() => vorps.id),
	read: boolean('read').default(false),
	createdAt: timestamp('created_at').defaultNow()
});

export const badges = pgTable('badges', {
	id: integer('id').primaryKey(),
	followers: integer('followers'),
	name: text('name'),
	description: text('description')
});

export const conversations = pgTable('conversations', {
	id: text('id').primaryKey(),
	name: text('name').notNull().default('Super cool conversations'),
	participants: text('participants').array().notNull(),
	recentMessage: timestamp('recentMessage').defaultNow()
});

export const directMessages = pgTable('directMessages', {
	id: text('id').primaryKey(),
	user_id: text('user_id').references(() => users.id),
	content: text('content').notNull(),
	created_at: timestamp('created_at').defaultNow(),
	edited: boolean('edited').default(false),
	conversationId: text('conversationId').references(() => conversations.id)
});
