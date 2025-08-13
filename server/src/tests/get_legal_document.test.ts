import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type GetDocumentInput, type CreateCategoryInput, type CreateLegalDocumentInput } from '../schema';
import { getLegalDocument } from '../handlers/get_legal_document';
import { eq } from 'drizzle-orm';

// Test data
const testCategory: CreateCategoryInput = {
  name_id: 'Kategori Hukum',
  name_en: 'Legal Category',
  description_id: 'Deskripsi kategori hukum',
  description_en: 'Legal category description'
};

const testDocument: CreateLegalDocumentInput = {
  title_id: 'Undang-Undang Test',
  title_en: 'Test Law',
  content_id: 'Konten undang-undang dalam bahasa Indonesia',
  content_en: 'Law content in English language',
  summary_id: 'Ringkasan dalam bahasa Indonesia',
  summary_en: 'Summary in English',
  document_type: 'law',
  category_id: 1, // Will be set after category creation
  document_number: 'UU-2024-001',
  publication_date: new Date('2024-01-15'),
  effective_date: new Date('2024-02-01'),
  tags: ['hukum', 'law', 'peraturan'],
  file_url: 'https://example.com/law.pdf',
  is_published: true
};

const testDocumentMinimal: CreateLegalDocumentInput = {
  title_id: 'Artikel Minimal',
  title_en: 'Minimal Article',
  content_id: 'Konten minimal',
  content_en: 'Minimal content',
  summary_id: null,
  summary_en: null,
  document_type: 'article',
  category_id: 1,
  document_number: null,
  publication_date: null,
  effective_date: null,
  tags: [],
  file_url: null,
  is_published: false
};

describe('getLegalDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get legal document with Indonesian localization', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryId,
        tags: testDocument.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Test Indonesian localization (default)
    const input: GetDocumentInput = {
      id: documentId,
      language: 'id'
    };

    const result = await getLegalDocument(input);

    // Verify Indonesian content is returned
    expect(result.id).toEqual(documentId);
    expect(result.title).toEqual('Undang-Undang Test');
    expect(result.content).toEqual('Konten undang-undang dalam bahasa Indonesia');
    expect(result.summary).toEqual('Ringkasan dalam bahasa Indonesia');
    expect(result.category_name).toEqual('Kategori Hukum');
    expect(result.document_type).toEqual('law');
    expect(result.category_id).toEqual(categoryId);
    expect(result.document_number).toEqual('UU-2024-001');
    expect(result.publication_date).toBeInstanceOf(Date);
    expect(result.effective_date).toBeInstanceOf(Date);
    expect(result.tags).toEqual(['hukum', 'law', 'peraturan']);
    expect(result.file_url).toEqual('https://example.com/law.pdf');
    expect(result.is_published).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should get legal document with English localization', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryId,
        tags: testDocument.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Test English localization
    const input: GetDocumentInput = {
      id: documentId,
      language: 'en'
    };

    const result = await getLegalDocument(input);

    // Verify English content is returned
    expect(result.id).toEqual(documentId);
    expect(result.title).toEqual('Test Law');
    expect(result.content).toEqual('Law content in English language');
    expect(result.summary).toEqual('Summary in English');
    expect(result.category_name).toEqual('Legal Category');
    expect(result.document_type).toEqual('law');
    expect(result.category_id).toEqual(categoryId);
  });

  it('should handle document with null/minimal fields', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create minimal document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocumentMinimal,
        category_id: categoryId,
        tags: testDocumentMinimal.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      language: 'id'
    };

    const result = await getLegalDocument(input);

    // Verify minimal fields are handled correctly
    expect(result.id).toEqual(documentId);
    expect(result.title).toEqual('Artikel Minimal');
    expect(result.summary).toBeNull();
    expect(result.document_number).toBeNull();
    expect(result.publication_date).toBeNull();
    expect(result.effective_date).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.file_url).toBeNull();
    expect(result.is_published).toBe(false);
  });

  it('should handle document with different document types', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Test different document types
    const decisionDocument = {
      ...testDocument,
      document_type: 'decision' as const,
      title_id: 'Keputusan Test',
      title_en: 'Test Decision',
      document_number: 'KEP-2024-001'
    };

    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...decisionDocument,
        category_id: categoryId,
        tags: decisionDocument.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      language: 'id'
    };

    const result = await getLegalDocument(input);

    expect(result.document_type).toEqual('decision');
    expect(result.document_number).toEqual('KEP-2024-001');
    expect(result.title).toEqual('Keputusan Test');
  });

  it('should use default language when not specified', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryId,
        tags: testDocument.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Test with language default (should be 'id' based on schema)
    const input = {
      id: documentId
      // language will default to 'id' via Zod schema
    } as GetDocumentInput;

    const result = await getLegalDocument(input);

    // Should return Indonesian content by default
    expect(result.title).toEqual('Undang-Undang Test');
    expect(result.category_name).toEqual('Kategori Hukum');
  });

  it('should throw error when document not found', async () => {
    const input: GetDocumentInput = {
      id: 99999, // Non-existent ID
      language: 'id'
    };

    await expect(getLegalDocument(input)).rejects.toThrow(/not found/i);
  });

  it('should handle empty tags array correctly', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document with empty tags
    const documentWithEmptyTags = {
      ...testDocument,
      tags: []
    };

    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...documentWithEmptyTags,
        category_id: categoryId,
        tags: []
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      language: 'id'
    };

    const result = await getLegalDocument(input);

    expect(result.tags).toEqual([]);
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('should verify document is properly joined with category', async () => {
    // Create category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: testCategory.name_id,
        name_en: testCategory.name_en,
        description_id: testCategory.description_id,
        description_en: testCategory.description_en
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryId,
        tags: testDocument.tags
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    const input: GetDocumentInput = {
      id: documentId,
      language: 'en'
    };

    const result = await getLegalDocument(input);

    // Verify that category information is properly included
    expect(result.category_id).toEqual(categoryId);
    expect(result.category_name).toEqual('Legal Category');

    // Verify this is the same category we created
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name_en).toEqual('Legal Category');
  });
});