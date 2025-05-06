const { pgTable, serial, text, varchar, timestamp, index } = require('drizzle-orm/pg-core');

// Users table schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email),
    userIdIdx: index('user_id_idx').on(table.userId),
  };
});

// Files table schema
const files = pgTable('files', {
  id: serial('id').primaryKey(),
  fileId: varchar('file_id', { length: 255 }).notNull().unique(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  s3Key: varchar('s3_key', { length: 255 }).notNull(),
  size: serial('size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Owner's userId
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    fileIdIdx: index('file_id_idx').on(table.fileId),
    userIdIdx: index('files_user_id_idx').on(table.userId),
  };
});

// File shares table schema
const fileShares = pgTable('file_shares', {
  id: serial('id').primaryKey(),
  fileId: varchar('file_id', { length: 255 }).notNull(),
  ownerId: varchar('owner_id', { length: 255 }).notNull(), // The owner who shared the file
  sharedWithId: varchar('shared_with_id', { length: 255 }).notNull(), // User it was shared with
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    fileIdIdx: index('file_share_file_id_idx').on(table.fileId),
    ownerIdIdx: index('owner_id_idx').on(table.ownerId),
    sharedWithIdIdx: index('shared_with_id_idx').on(table.sharedWithId),
    uniqueShare: index('unique_share_idx').on(table.fileId, table.sharedWithId),
  };
});

module.exports = {
  users,
  files,
  fileShares
};
