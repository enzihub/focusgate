import { relations } from 'drizzle-orm';
import {
  text,
  timestamp,
  pgTable,
  boolean,
  integer,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique(),
  fullName: text('full_name'),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  billingAddress: text('billing_address'),
  paymentMethod: text('payment_method'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Customers table (for Stripe integration)
export const customers = pgTable('customers', {
  email: text('email').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  email: text('email'),
  status: text('status'),
  metadata: text('metadata'),
  priceId: text('price_id'),
  quantity: integer('quantity'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  endedAt: timestamp('ended_at'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  subscriptionCreatedAt: timestamp('subscription_created_at'),
  subscriptionEndedAt: timestamp('subscription_ended_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// UserPrefs table
export const userPrefs = pgTable('user_prefs', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .defaultRandom()
    .references(() => users.id),
  email: text('email').notNull(),
  description: text('description'),
  timezone: text('timezone').default('UTC'),
  phone: text('phone'),
  prefTime: text('pref_time').default('07:00'),
  isSubscribed: boolean('is_subscribed').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Slack workspaces table
export const userSlackWorkspaces = pgTable(
  'user_slack_workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    workspaceId: text('workspace_id').notNull(),
    workspaceName: text('workspace_name').notNull(),
    userAccessToken: text('user_access_token').notNull(),
    botUserId: text('bot_user_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Add unique constraint on userId and workspaceId combination
    userWorkspaceUnique: unique().on(table.userId),
  }),
);

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  customer: one(customers),
  subscription: one(subscriptions),
  tweetPrefs: one(userPrefs),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const userTweetPrefsRelations = relations(userPrefs, ({ one }) => ({
  user: one(users, {
    fields: [userPrefs.userId],
    references: [users.id],
  }),
}));

export const userSlackWorkspacesRelations = relations(
  userSlackWorkspaces,
  ({ one }) => ({
    user: one(users, {
      fields: [userSlackWorkspaces.userId],
      references: [users.id],
    }),
  }),
);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type UpsertUserInput = {
  id?: string;
  clerkId: string;
  fullName?: string | null;
  primaryEmailAddress?: {
    emailAddress: string;
  };
  imageUrl?: string | null;
};

export type InsertCustomer = typeof customers.$inferInsert;
export type SelectCustomer = typeof customers.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SelectSubscription = typeof subscriptions.$inferSelect;
export type UpsertSubscriptionInput = {
  email?: string;
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
};

export type InsertUserPref = typeof userPrefs.$inferInsert;
export type SelectUserPref = typeof userPrefs.$inferSelect;

export type InsertUserSlackWorkspace = typeof userSlackWorkspaces.$inferInsert;
export type SelectUserSlackWorkspace = typeof userSlackWorkspaces.$inferSelect;
