import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type CreateLegalDocumentInput } from '../schema';
import { createLegalDocument } from '../handlers/create_legal_document';
import { eq } from 'drizzle-orm';

// Test category data
const testCategory = {
  name_id: 'Hukum Pidana',
  name_en: 'Criminal Law',
  description_id: 'Kategori untuk hukum pidana',
  description_en: 'Category for criminal law'
};

// Base test input for legal document
const baseTestInput: CreateLegalDocumentInput = {
  title_id: 'Undang-Undang Pidana Indonesia',
  title_en: 'Indonesian Criminal Law',
  content_id: 'Isi undang-undang pidana dalam bahasa Indonesia',
  content_en: 'Criminal law content in English',
  summary_id: 'Ringkasan undang-undang pidana',
  summary_en: 'Summary of criminal law',
  document_type: 'law',
  category_id: 1, // Will be set after category creation
  document_number: 'UU-001/2024',
  publication_date: new Date('2024-01-15'),
  effective_date: new Date('2024-02-01'),
  tags: ['pidana', 'hukum', 'criminal', 'law'],
  file_url: 'https://example.com/documents/criminal-law.pdf',
  is_published: true
};

describe('createLegalDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a legal document with all fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Update test input with actual category ID
    const testInput = { ...baseTestInput, category_id: categoryId };

    const result = await createLegalDocument(testInput);

    // Verify basic fields
    expect(result.title_id).toEqual('Undang-Undang Pidana Indonesia');
    expect(result.title_en).toEqual('Indonesian Criminal Law');
    expect(result.content_id).toEqual(testInput.content_id);
    expect(result.content_en).toEqual(testInput.content_en);
    expect(result.summary_id).toEqual(testInput.summary_id);
    expect(result.summary_en).toEqual(testInput.summary_en);
    expect(result.document_type).toEqual('law');
    expect(result.category_id).toEqual(categoryId);
    expect(result.document_number).toEqual('UU-001/2024');
    expect(result.publication_date).toEqual(testInput.publication_date);
    expect(result.effective_date).toEqual(testInput.effective_date);
    expect(result.tags).toEqual(['pidana', 'hukum', 'criminal', 'law']);
    expect(result.file_url).toEqual(testInput.file_url);
    expect(result.is_published).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save legal document to database', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const testInput = { ...baseTestInput, category_id: categoryId };
    const result = await createLegalDocument(testInput);

    // Query from database to verify
    const documents = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, result.id))
      .execute();

    expect(documents).toHaveLength(1);
    const saved = documents[0];
    expect(saved.title_id).toEqual('Undang-Undang Pidana Indonesia');
    expect(saved.title_en).toEqual('Indonesian Criminal Law');
    expect(saved.document_type).toEqual('law');
    expect(saved.category_id).toEqual(categoryId);
    expect(saved.document_number).toEqual('UU-001/2024');
    expect(saved.tags).toEqual(['pidana', 'hukum', 'criminal', 'law']);
    expect(saved.is_published).toBe(true);
    expect(saved.created_at).toBeInstanceOf(Date);
    expect(saved.updated_at).toBeInstanceOf(Date);
  });

  it('should create article type document', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const articleInput: CreateLegalDocumentInput = {
      ...baseTestInput,
      category_id: categoryId,
      title_id: 'Artikel Hukum Kontrak',
      title_en: 'Contract Law Article',
      document_type: 'article',
      document_number: null, // Articles typically don't have numbers
      publication_date: new Date('2024-03-10'),
      effective_date: null, // Articles don't have effective dates
      tags: ['kontrak', 'artikel', 'contract', 'article']
    };

    const result = await createLegalDocument(articleInput);

    expect(result.document_type).toEqual('article');
    expect(result.document_number).toBeNull();
    expect(result.effective_date).toBeNull();
    expect(result.tags).toEqual(['kontrak', 'artikel', 'contract', 'article']);
  });

  it('should create decision type document', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const decisionInput: CreateLegalDocumentInput = {
      ...baseTestInput,
      category_id: categoryId,
      title_id: 'Putusan Mahkamah Agung',
      title_en: 'Supreme Court Decision',
      document_type: 'decision',
      document_number: 'PUT-123/2024',
      tags: ['putusan', 'ma', 'decision', 'supreme-court']
    };

    const result = await createLegalDocument(decisionInput);

    expect(result.document_type).toEqual('decision');
    expect(result.document_number).toEqual('PUT-123/2024');
    expect(result.tags).toEqual(['putusan', 'ma', 'decision', 'supreme-court']);
  });

  it('should create document with minimal required fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const minimalInput: CreateLegalDocumentInput = {
      title_id: 'Judul Minimal',
      title_en: 'Minimal Title',
      content_id: 'Konten minimal dalam bahasa Indonesia',
      content_en: 'Minimal content in English',
      summary_id: null,
      summary_en: null,
      document_type: 'article',
      category_id: categoryId,
      document_number: null,
      publication_date: null,
      effective_date: null,
      tags: [],
      file_url: null,
      is_published: false // Default from Zod schema
    };

    const result = await createLegalDocument(minimalInput);

    expect(result.title_id).toEqual('Judul Minimal');
    expect(result.title_en).toEqual('Minimal Title');
    expect(result.summary_id).toBeNull();
    expect(result.summary_en).toBeNull();
    expect(result.document_number).toBeNull();
    expect(result.publication_date).toBeNull();
    expect(result.effective_date).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.file_url).toBeNull();
    expect(result.is_published).toBe(false);
  });

  it('should handle empty tags array correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const testInput = {
      ...baseTestInput,
      category_id: categoryId,
      tags: [] // Empty array
    };

    const result = await createLegalDocument(testInput);
    expect(result.tags).toEqual([]);

    // Verify in database
    const saved = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, result.id))
      .execute();

    expect(saved[0].tags).toEqual([]);
  });

  it('should throw error when category does not exist', async () => {
    const testInput = {
      ...baseTestInput,
      category_id: 999 // Non-existent category ID
    };

    await expect(createLegalDocument(testInput)).rejects.toThrow(/Category with id 999 does not exist/i);
  });

  it('should handle date fields correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    const publicationDate = new Date('2024-06-15');
    const effectiveDate = new Date('2024-07-01');

    const testInput = {
      ...baseTestInput,
      category_id: categoryId,
      publication_date: publicationDate,
      effective_date: effectiveDate
    };

    const result = await createLegalDocument(testInput);

    expect(result.publication_date).toEqual(publicationDate);
    expect(result.effective_date).toEqual(effectiveDate);

    // Verify dates are stored correctly in database
    const saved = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, result.id))
      .execute();

    expect(saved[0].publication_date).toBeInstanceOf(Date);
    expect(saved[0].effective_date).toBeInstanceOf(Date);
    expect(saved[0].publication_date!.getTime()).toEqual(publicationDate.getTime());
    expect(saved[0].effective_date!.getTime()).toEqual(effectiveDate.getTime());
  });
});