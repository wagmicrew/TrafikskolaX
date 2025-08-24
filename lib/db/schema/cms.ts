import { pgTable, uuid, varchar, text, timestamp, integer, boolean, serial } from 'drizzle-orm/pg-core';

// Pages table for storing page content
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  excerpt: text('excerpt'),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  isStatic: boolean('is_static').default(false), // true if from filesystem, false if from database
  staticPath: varchar('static_path', { length: 255 }), // path to static file if isStatic is true
  authorId: uuid('author_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Menu items table for building the navigation
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references(() => menuItems.id), // For nested menus
  label: varchar('label', { length: 255 }).notNull(),
  url: varchar('url', { length: 255 }), // URL or slug for the page
  pageId: uuid('page_id').references(() => pages.id), // Link to a page
  isExternal: boolean('is_external').default(false), // true if external link
  icon: varchar('icon', { length: 100 }), // Icon name or class
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  isAdminMenu: boolean('is_admin_menu').default(false), // true for admin menu, false for main menu
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Page images table for managing uploaded images
export const pageImages = pgTable('page_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});
