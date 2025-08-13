import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type UpdateLegalDocumentInput, type CreateCategoryInput } from '../schema';
import { updateLegalDocument } from '../handlers/update_legal_document';
import { eq } from 'drizzle-orm';

// Test data setup
const testCategory: CreateCategoryInput = {
  name_id: 'Kategori Test',
  name_en: 'Test Category',
  description_id: 'Deskripsi kategori test',
  description_en: 'Test category description'
};

const secondCategory: CreateCategoryInput = {
  name_id: 'Kategori Kedua',
  name_en: 'Second Category',
  description_id: 'Deskripsi kategori kedua',
  description_en: 'Second category description'
};

const testDocument = {
  title_id: 'Dokumen Hukum Test',
  title_en: 'Test Legal Document',
  content_id: 'Konten dokumen hukum dalam bahasa Indonesia',
  content_en: 'Legal document content in English',
  summary_id: 'Ringkasan dokumen',
  summary_en: 'Document summary',
  document_type: 'article' as const,
  category_id: 1,
  document_number: 'DOC-001',
  publication_date: new Date('2024-01-01'),
  effective_date: new Date('2024-02-01'),
  tags: ['hukum', 'test'],
  file_url: 'https://example.com/doc.pdf',
  is_published: false
};

describe('updateLegalDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a legal document with all fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create initial document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const originalDocument = documentResult[0];

    // Update input with all fields
    const updateInput: UpdateLegalDocumentInput = {
      id: originalDocument.id,
      title_id: 'Dokumen yang Diperbarui',
      title_en: 'Updated Document',
      content_id: 'Konten yang diperbarui',
      content_en: 'Updated content',
      summary_id: 'Ringkasan baru',
      summary_en: 'New summary',
      document_type: 'law',
      document_number: 'LAW-002',
      publication_date: new Date('2024-03-01'),
      effective_date: new Date('2024-04-01'),
      tags: ['hukum', 'update'],
      file_url: 'https://example.com/updated.pdf',
      is_published: true
    };

    const result = await updateLegalDocument(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(originalDocument.id);
    expect(result.title_id).toEqual('Dokumen yang Diperbarui');
    expect(result.title_en).toEqual('Updated Document');
    expect(result.content_id).toEqual('Konten yang diperbarui');
    expect(result.content_en).toEqual('Updated content');
    expect(result.summary_id).toEqual('Ringkasan baru');
    expect(result.summary_en).toEqual('New summary');
    expect(result.document_type).toEqual('law');
    expect(result.document_number).toEqual('LAW-002');
    expect(result.publication_date).toEqual(new Date('2024-03-01'));
    expect(result.effective_date).toEqual(new Date('2024-04-01'));
    expect(result.tags).toEqual(['hukum', 'update']);
    expect(result.file_url).toEqual('https://example.com/updated.pdf');
    expect(result.is_published).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalDocument.updated_at.getTime());
  });

  it('should update document with partial fields', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create initial document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const originalDocument = documentResult[0];

    // Update only title and publication status
    const updateInput: UpdateLegalDocumentInput = {
      id: originalDocument.id,
      title_id: 'Judul Baru',
      is_published: true
    };

    const result = await updateLegalDocument(updateInput);

    // Verify only specified fields are updated
    expect(result.title_id).toEqual('Judul Baru');
    expect(result.is_published).toEqual(true);
    
    // Verify other fields remain unchanged
    expect(result.title_en).toEqual(originalDocument.title_en);
    expect(result.content_id).toEqual(originalDocument.content_id);
    expect(result.content_en).toEqual(originalDocument.content_en);
    expect(result.document_type).toEqual(originalDocument.document_type);
    expect(result.category_id).toEqual(originalDocument.category_id);
  });

  it('should update category_id when valid category provided', async () => {
    // Create two categories
    const firstCategoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const secondCategoryResult = await db.insert(categoriesTable)
      .values(secondCategory)
      .returning()
      .execute();

    // Create document with first category
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: firstCategoryResult[0].id
      })
      .returning()
      .execute();

    // Update to second category
    const updateInput: UpdateLegalDocumentInput = {
      id: documentResult[0].id,
      category_id: secondCategoryResult[0].id
    };

    const result = await updateLegalDocument(updateInput);

    expect(result.category_id).toEqual(secondCategoryResult[0].id);
  });

  it('should update nullable fields to null', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create document with non-null values
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Update nullable fields to null
    const updateInput: UpdateLegalDocumentInput = {
      id: documentResult[0].id,
      summary_id: null,
      summary_en: null,
      document_number: null,
      publication_date: null,
      effective_date: null,
      file_url: null
    };

    const result = await updateLegalDocument(updateInput);

    expect(result.summary_id).toBeNull();
    expect(result.summary_en).toBeNull();
    expect(result.document_number).toBeNull();
    expect(result.publication_date).toBeNull();
    expect(result.effective_date).toBeNull();
    expect(result.file_url).toBeNull();
  });

  it('should save updated document to database', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create initial document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const originalDocument = documentResult[0];

    // Update document
    const updateInput: UpdateLegalDocumentInput = {
      id: originalDocument.id,
      title_id: 'Judul Database Test',
      is_published: true
    };

    await updateLegalDocument(updateInput);

    // Verify changes are persisted in database
    const updatedInDB = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, originalDocument.id))
      .execute();

    expect(updatedInDB).toHaveLength(1);
    expect(updatedInDB[0].title_id).toEqual('Judul Database Test');
    expect(updatedInDB[0].is_published).toEqual(true);
    expect(updatedInDB[0].updated_at.getTime()).toBeGreaterThan(originalDocument.updated_at.getTime());
  });

  it('should throw error when document not found', async () => {
    const updateInput: UpdateLegalDocumentInput = {
      id: 99999,
      title_id: 'Non-existent Document'
    };

    await expect(updateLegalDocument(updateInput))
      .rejects.toThrow(/Legal document with id 99999 not found/i);
  });

  it('should throw error when category does not exist', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Try to update with non-existent category
    const updateInput: UpdateLegalDocumentInput = {
      id: documentResult[0].id,
      category_id: 99999
    };

    await expect(updateLegalDocument(updateInput))
      .rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should handle empty tags array', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create document with tags
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        tags: ['tag1', 'tag2']
      })
      .returning()
      .execute();

    // Update to empty tags
    const updateInput: UpdateLegalDocumentInput = {
      id: documentResult[0].id,
      tags: []
    };

    const result = await updateLegalDocument(updateInput);

    expect(result.tags).toEqual([]);
  });
});