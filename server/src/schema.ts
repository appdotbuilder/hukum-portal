import { z } from 'zod';

// Enum for supported languages
export const languageSchema = z.enum(['id', 'en']); // Indonesian and English
export type Language = z.infer<typeof languageSchema>;

// Enum for document types
export const documentTypeSchema = z.enum(['article', 'law', 'decision']);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name_id: z.string(), // Indonesian name
  name_en: z.string(), // English name
  description_id: z.string().nullable(), // Indonesian description
  description_en: z.string().nullable(), // English description
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Legal document schema
export const legalDocumentSchema = z.object({
  id: z.number(),
  title_id: z.string(), // Indonesian title
  title_en: z.string(), // English title
  content_id: z.string(), // Indonesian content
  content_en: z.string(), // English content
  summary_id: z.string().nullable(), // Indonesian summary
  summary_en: z.string().nullable(), // English summary
  document_type: documentTypeSchema,
  category_id: z.number(),
  document_number: z.string().nullable(), // For laws and decisions
  publication_date: z.coerce.date().nullable(),
  effective_date: z.coerce.date().nullable(), // When the law/decision takes effect
  tags: z.array(z.string()), // Array of tags for search
  file_url: z.string().nullable(), // URL to PDF or other document file
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LegalDocument = z.infer<typeof legalDocumentSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name_id: z.string().min(1, 'Indonesian name is required'),
  name_en: z.string().min(1, 'English name is required'),
  description_id: z.string().nullable(),
  description_en: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name_id: z.string().min(1).optional(),
  name_en: z.string().min(1).optional(),
  description_id: z.string().nullable().optional(),
  description_en: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for creating legal documents
export const createLegalDocumentInputSchema = z.object({
  title_id: z.string().min(1, 'Indonesian title is required'),
  title_en: z.string().min(1, 'English title is required'),
  content_id: z.string().min(1, 'Indonesian content is required'),
  content_en: z.string().min(1, 'English content is required'),
  summary_id: z.string().nullable(),
  summary_en: z.string().nullable(),
  document_type: documentTypeSchema,
  category_id: z.number(),
  document_number: z.string().nullable(),
  publication_date: z.coerce.date().nullable(),
  effective_date: z.coerce.date().nullable(),
  tags: z.array(z.string()),
  file_url: z.string().nullable(),
  is_published: z.boolean().default(false)
});

export type CreateLegalDocumentInput = z.infer<typeof createLegalDocumentInputSchema>;

// Input schema for updating legal documents
export const updateLegalDocumentInputSchema = z.object({
  id: z.number(),
  title_id: z.string().min(1).optional(),
  title_en: z.string().min(1).optional(),
  content_id: z.string().min(1).optional(),
  content_en: z.string().min(1).optional(),
  summary_id: z.string().nullable().optional(),
  summary_en: z.string().nullable().optional(),
  document_type: documentTypeSchema.optional(),
  category_id: z.number().optional(),
  document_number: z.string().nullable().optional(),
  publication_date: z.coerce.date().nullable().optional(),
  effective_date: z.coerce.date().nullable().optional(),
  tags: z.array(z.string()).optional(),
  file_url: z.string().nullable().optional(),
  is_published: z.boolean().optional()
});

export type UpdateLegalDocumentInput = z.infer<typeof updateLegalDocumentInputSchema>;

// Search input schema
export const searchDocumentsInputSchema = z.object({
  query: z.string().optional(), // Text search in title and content
  document_type: documentTypeSchema.optional(),
  category_id: z.number().optional(),
  language: languageSchema.default('id'), // Default to Indonesian
  tags: z.array(z.string()).optional(),
  published_only: z.boolean().default(true), // Only return published documents by default
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchDocumentsInput = z.infer<typeof searchDocumentsInputSchema>;

// Document detail view input schema
export const getDocumentInputSchema = z.object({
  id: z.number(),
  language: languageSchema.default('id')
});

export type GetDocumentInput = z.infer<typeof getDocumentInputSchema>;

// Localized document response schema (for single language response)
export const localizedDocumentSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  summary: z.string().nullable(),
  document_type: documentTypeSchema,
  category_id: z.number(),
  category_name: z.string(),
  document_number: z.string().nullable(),
  publication_date: z.coerce.date().nullable(),
  effective_date: z.coerce.date().nullable(),
  tags: z.array(z.string()),
  file_url: z.string().nullable(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LocalizedDocument = z.infer<typeof localizedDocumentSchema>;

// Search results schema
export const searchResultsSchema = z.object({
  documents: z.array(localizedDocumentSchema),
  total_count: z.number(),
  has_more: z.boolean()
});

export type SearchResults = z.infer<typeof searchResultsSchema>;