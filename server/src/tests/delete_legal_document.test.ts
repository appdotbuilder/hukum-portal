import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, legalDocumentsTable } from '../db/schema';
import { type CreateCategoryInput, type CreateLegalDocumentInput } from '../schema';
import { deleteLegalDocument } from '../handlers/delete_legal_document';
import { eq } from 'drizzle-orm';

// Test data
const testCategory: CreateCategoryInput = {
  name_id: 'Hukum Pidana',
  name_en: 'Criminal Law',
  description_id: 'Kategori untuk hukum pidana',
  description_en: 'Category for criminal law'
};

const testDocument: CreateLegalDocumentInput = {
  title_id: 'Undang-Undang Test',
  title_en: 'Test Law',
  content_id: 'Konten hukum dalam bahasa Indonesia',
  content_en: 'Legal content in English',
  summary_id: 'Ringkasan dalam bahasa Indonesia',
  summary_en: 'Summary in English',
  document_type: 'law',
  category_id: 1, // Will be set after category creation
  document_number: 'UU-001-2024',
  publication_date: new Date('2024-01-15'),
  effective_date: new Date('2024-02-01'),
  tags: ['criminal', 'law', 'punishment'],
  file_url: 'https://example.com/law-001.pdf',
  is_published: true
};

describe('deleteLegalDocument', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing legal document', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create test document
    const documentResult = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const documentId = documentResult[0].id;

    // Verify document exists before deletion
    const beforeDeletion = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, documentId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);

    // Delete the document
    const result = await deleteLegalDocument(documentId);

    expect(result).toBe(true);

    // Verify document is deleted
    const afterDeletion = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, documentId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent document', async () => {
    const nonExistentId = 999999;

    const result = await deleteLegalDocument(nonExistentId);

    expect(result).toBe(false);
  });

  it('should handle multiple deletions correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create multiple test documents
    const document1 = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        title_id: 'Dokumen 1',
        title_en: 'Document 1'
      })
      .returning()
      .execute();

    const document2 = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        title_id: 'Dokumen 2',
        title_en: 'Document 2'
      })
      .returning()
      .execute();

    // Verify both documents exist
    const allDocuments = await db.select()
      .from(legalDocumentsTable)
      .execute();

    expect(allDocuments).toHaveLength(2);

    // Delete first document
    const result1 = await deleteLegalDocument(document1[0].id);
    expect(result1).toBe(true);

    // Delete second document
    const result2 = await deleteLegalDocument(document2[0].id);
    expect(result2).toBe(true);

    // Verify both documents are deleted
    const remainingDocuments = await db.select()
      .from(legalDocumentsTable)
      .execute();

    expect(remainingDocuments).toHaveLength(0);
  });

  it('should not affect other documents when deleting one', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create multiple test documents
    const document1 = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        title_id: 'Dokumen untuk dihapus',
        title_en: 'Document to delete'
      })
      .returning()
      .execute();

    const document2 = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        title_id: 'Dokumen untuk disimpan',
        title_en: 'Document to keep'
      })
      .returning()
      .execute();

    // Delete only the first document
    const result = await deleteLegalDocument(document1[0].id);
    expect(result).toBe(true);

    // Verify first document is deleted
    const deletedDocument = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, document1[0].id))
      .execute();

    expect(deletedDocument).toHaveLength(0);

    // Verify second document still exists
    const remainingDocument = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, document2[0].id))
      .execute();

    expect(remainingDocument).toHaveLength(1);
    expect(remainingDocument[0].title_id).toBe('Dokumen untuk disimpan');
  });

  it('should handle deletion of document with different document types', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    // Create documents with different types
    const lawDocument = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        document_type: 'law',
        title_id: 'Undang-undang Test',
        title_en: 'Test Law'
      })
      .returning()
      .execute();

    const articleDocument = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        document_type: 'article',
        title_id: 'Artikel Test',
        title_en: 'Test Article'
      })
      .returning()
      .execute();

    const decisionDocument = await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: categoryResult[0].id,
        document_type: 'decision',
        title_id: 'Keputusan Test',
        title_en: 'Test Decision'
      })
      .returning()
      .execute();

    // Delete each document type
    const lawResult = await deleteLegalDocument(lawDocument[0].id);
    expect(lawResult).toBe(true);

    const articleResult = await deleteLegalDocument(articleDocument[0].id);
    expect(articleResult).toBe(true);

    const decisionResult = await deleteLegalDocument(decisionDocument[0].id);
    expect(decisionResult).toBe(true);

    // Verify all documents are deleted
    const remainingDocuments = await db.select()
      .from(legalDocumentsTable)
      .execute();

    expect(remainingDocuments).toHaveLength(0);
  });
});