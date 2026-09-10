import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const batches = pgTable('batches', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  abattoir: text('abattoir').notNull(),
  farm: text('farm').notNull(),
  batchId: text('batch_id').notNull(),
  totalAnimals: integer('total_animals').notNull(),
  date: real('date').notNull(), // Unix timestamp
  createdAt: timestamp('created_at').defaultNow(),
});

export const evaluations = pgTable('evaluations', {
  id: text('id').primaryKey(),
  batchId: text('batch_id').references(() => batches.id).notNull(),
  animalIndex: integer('animal_index').notNull(),
  rightCranial: integer('right_cranial').notNull(),
  rightMiddle: integer('right_middle').notNull(),
  rightCaudal: integer('right_caudal').notNull(),
  accessory: integer('accessory').notNull(),
  leftCranial: integer('left_cranial').notNull(),
  leftMiddle: integer('left_middle').notNull(),
  leftCaudal: integer('left_caudal').notNull(),
  scarring: boolean('scarring').notNull(),
  pleurisy: boolean('pleurisy').notNull(),
  spes: integer('spes').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one, many }) => ({
  user: one(users, {
    fields: [batches.userId],
    references: [users.id],
  }),
  evaluations: many(evaluations),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  batch: one(batches, {
    fields: [evaluations.batchId],
    references: [batches.id],
  }),
}));
