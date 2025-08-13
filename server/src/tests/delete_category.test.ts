import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, legalDocumentsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully when no documents are associated', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name_id: 'Test Category ID',
        name_en: 'Test Category EN',
        description_id: 'Test description ID',
        description_en: 'Test description EN'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Delete the category
    const result = await deleteCategory(categoryId);
    expect(result).toBe(true);

    // Verify the category was deleted from the database
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteCategory(nonExistentId))
      .rejects.toThrow(/Category with id 999 not found/i);
  });

  it('should prevent deletion when category has associated documents', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name_id: 'Test Category ID',
        name_en: 'Test Category EN',
        description_id: 'Test description ID',
        description_en: 'Test description EN'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create an associated legal document
    await db.insert(legalDocumentsTable)
      .values({
        title_id: 'Test Document ID',
        title_en: 'Test Document EN',
        content_id: 'Test content in Indonesian',
        content_en: 'Test content in English',
        summary_id: 'Test summary ID',
        summary_en: 'Test summary EN',
        document_type: 'article',
        category_id: categoryId,
        document_number: 'DOC-001',
        publication_date: new Date(),
        effective_date: new Date(),
        tags: ['test', 'document'],
        file_url: 'https://example.com/doc.pdf',
        is_published: true
      })
      .execute();

    // Attempt to delete the category should fail
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/Cannot delete category with id \d+\. Category has 1 associated documents/i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
    expect(existingCategory[0].name_id).toBe('Test Category ID');
  });

  it('should prevent deletion when category has multiple associated documents', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name_id: 'Category with Multiple Docs',
        name_en: 'Category with Multiple Docs EN',
        description_id: null,
        description_en: null
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create multiple associated legal documents
    await db.insert(legalDocumentsTable)
      .values([
        {
          title_id: 'First Document ID',
          title_en: 'First Document EN',
          content_id: 'First content in Indonesian',
          content_en: 'First content in English',
          summary_id: null,
          summary_en: null,
          document_type: 'law',
          category_id: categoryId,
          document_number: 'LAW-001',
          publication_date: new Date(),
          effective_date: new Date(),
          tags: ['law', 'first'],
          file_url: null,
          is_published: false
        },
        {
          title_id: 'Second Document ID',
          title_en: 'Second Document EN',
          content_id: 'Second content in Indonesian',
          content_en: 'Second content in English',
          summary_id: null,
          summary_en: null,
          document_type: 'decision',
          category_id: categoryId,
          document_number: 'DEC-001',
          publication_date: null,
          effective_date: null,
          tags: ['decision', 'second'],
          file_url: null,
          is_published: true
        }
      ])
      .execute();

    // Attempt to delete the category should fail
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/Cannot delete category with id \d+\. Category has 2 associated documents/i);

    // Verify the category still exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(existingCategory).toHaveLength(1);
    expect(existingCategory[0].name_id).toBe('Category with Multiple Docs');
  });

  it('should handle database errors gracefully', async () => {
    // Test with a negative ID which should cause a database constraint error or similar
    const invalidId = -1;

    await expect(deleteCategory(invalidId))
      .rejects.toThrow(); // Should throw some kind of error

    // Test with a large ID that doesn't exist (within PostgreSQL integer range)
    const largeId = 2147483647; // PostgreSQL max integer value

    await expect(deleteCategory(largeId))
      .rejects.toThrow(/Category with id .+ not found/i);
  });

  it('should properly count documents across different document types', async () => {
    // Create a test category
    const category = await db.insert(categoriesTable)
      .values({
        name_id: 'Mixed Document Category',
        name_en: 'Mixed Document Category EN',
        description_id: 'Category with mixed document types',
        description_en: 'Category with mixed document types EN'
      })
      .returning()
      .execute();

    const categoryId = category[0].id;

    // Create documents of all three types
    await db.insert(legalDocumentsTable)
      .values([
        {
          title_id: 'Article Document',
          title_en: 'Article Document EN',
          content_id: 'Article content',
          content_en: 'Article content EN',
          summary_id: null,
          summary_en: null,
          document_type: 'article',
          category_id: categoryId,
          document_number: null,
          publication_date: new Date(),
          effective_date: null,
          tags: ['article'],
          file_url: null,
          is_published: true
        },
        {
          title_id: 'Law Document',
          title_en: 'Law Document EN',
          content_id: 'Law content',
          content_en: 'Law content EN',
          summary_id: null,
          summary_en: null,
          document_type: 'law',
          category_id: categoryId,
          document_number: 'LAW-123',
          publication_date: new Date(),
          effective_date: new Date(),
          tags: ['law'],
          file_url: null,
          is_published: false
        },
        {
          title_id: 'Decision Document',
          title_en: 'Decision Document EN',
          content_id: 'Decision content',
          content_en: 'Decision content EN',
          summary_id: null,
          summary_en: null,
          document_type: 'decision',
          category_id: categoryId,
          document_number: 'DEC-456',
          publication_date: null,
          effective_date: new Date(),
          tags: ['decision'],
          file_url: null,
          is_published: true
        }
      ])
      .execute();

    // Attempt to delete should fail with count of 3
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/Cannot delete category with id \d+\. Category has 3 associated documents/i);
  });
});