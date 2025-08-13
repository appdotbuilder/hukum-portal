import { serial, text, pgTable, timestamp, boolean, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions for PostgreSQL
export const documentTypeEnum = pgEnum('document_type', ['article', 'law', 'decision']);

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name_id: text('name_id').notNull(), // Indonesian name
  name_en: text('name_en').notNull(), // English name
  description_id: text('description_id'), // Indonesian description (nullable)
  description_en: text('description_en'), // English description (nullable)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Legal documents table
export const legalDocumentsTable = pgTable('legal_documents', {
  id: serial('id').primaryKey(),
  title_id: text('title_id').notNull(), // Indonesian title
  title_en: text('title_en').notNull(), // English title
  content_id: text('content_id').notNull(), // Indonesian content
  content_en: text('content_en').notNull(), // English content
  summary_id: text('summary_id'), // Indonesian summary (nullable)
  summary_en: text('summary_en'), // English summary (nullable)
  document_type: documentTypeEnum('document_type').notNull(),
  category_id: integer('category_id').notNull(), // Foreign key to categories
  document_number: text('document_number'), // For laws and decisions (nullable)
  publication_date: timestamp('publication_date'), // When document was published (nullable)
  effective_date: timestamp('effective_date'), // When law/decision takes effect (nullable)
  tags: json('tags').$type<string[]>().notNull().default([]), // Array of tags stored as JSON
  file_url: text('file_url'), // URL to PDF or document file (nullable)
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  documents: many(legalDocumentsTable),
}));

export const legalDocumentsRelations = relations(legalDocumentsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [legalDocumentsTable.category_id],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect; // For SELECT operations
export type NewCategory = typeof categoriesTable.$inferInsert; // For INSERT operations

export type LegalDocument = typeof legalDocumentsTable.$inferSelect; // For SELECT operations
export type NewLegalDocument = typeof legalDocumentsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  categories: categoriesTable,
  legalDocuments: legalDocumentsTable
};

export const schema = {
  categoriesTable,
  legalDocumentsTable,
  categoriesRelations,
  legalDocumentsRelations,
};