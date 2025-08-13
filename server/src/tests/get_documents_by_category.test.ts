import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, legalDocumentsTable } from '../db/schema';
import { getDocumentsByCategory } from '../handlers/get_documents_by_category';

const testCategory = {
  name_id: 'Hukum Pidana',
  name_en: 'Criminal Law',
  description_id: 'Kategori untuk hukum pidana',
  description_en: 'Category for criminal law'
};

const testDocument = {
  title_id: 'Undang-Undang Pidana',
  title_en: 'Criminal Law Act',
  content_id: 'Konten hukum pidana dalam bahasa Indonesia',
  content_en: 'Criminal law content in English',
  summary_id: 'Ringkasan hukum pidana',
  summary_en: 'Criminal law summary',
  document_type: 'law' as const,
  document_number: 'UU-001-2023',
  publication_date: new Date('2023-01-15'),
  effective_date: new Date('2023-03-01'),
  tags: ['pidana', 'criminal', 'hukum'],
  file_url: 'https://example.com/criminal-law.pdf',
  is_published: true
};

const unpublishedDocument = {
  title_id: 'Draft Undang-Undang',
  title_en: 'Draft Law',
  content_id: 'Draft konten',
  content_en: 'Draft content',
  summary_id: null,
  summary_en: null,
  document_type: 'law' as const,
  document_number: 'DRAFT-001-2024',
  publication_date: null,
  effective_date: null,
  tags: ['draft'],
  file_url: null,
  is_published: false
};

describe('getDocumentsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return published documents for a category in Indonesian', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create published document
    await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: category.id
      })
      .execute();

    // Create unpublished document (should not be returned)
    await db.insert(legalDocumentsTable)
      .values({
        ...unpublishedDocument,
        category_id: category.id
      })
      .execute();

    const result = await getDocumentsByCategory(category.id, 'id');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Undang-Undang Pidana');
    expect(result[0].content).toEqual('Konten hukum pidana dalam bahasa Indonesia');
    expect(result[0].summary).toEqual('Ringkasan hukum pidana');
    expect(result[0].category_name).toEqual('Hukum Pidana');
    expect(result[0].document_type).toEqual('law');
    expect(result[0].category_id).toEqual(category.id);
    expect(result[0].document_number).toEqual('UU-001-2023');
    expect(result[0].tags).toEqual(['pidana', 'criminal', 'hukum']);
    expect(result[0].file_url).toEqual('https://example.com/criminal-law.pdf');
    expect(result[0].is_published).toBe(true);
    expect(result[0].publication_date).toBeInstanceOf(Date);
    expect(result[0].effective_date).toBeInstanceOf(Date);
  });

  it('should return published documents for a category in English', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create published document
    await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: category.id
      })
      .execute();

    const result = await getDocumentsByCategory(category.id, 'en');

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Criminal Law Act');
    expect(result[0].content).toEqual('Criminal law content in English');
    expect(result[0].summary).toEqual('Criminal law summary');
    expect(result[0].category_name).toEqual('Criminal Law');
    expect(result[0].document_type).toEqual('law');
    expect(result[0].category_id).toEqual(category.id);
  });

  it('should default to Indonesian language when no language specified', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create published document
    await db.insert(legalDocumentsTable)
      .values({
        ...testDocument,
        category_id: category.id
      })
      .execute();

    const result = await getDocumentsByCategory(category.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Undang-Undang Pidana');
    expect(result[0].content).toEqual('Konten hukum pidana dalam bahasa Indonesia');
    expect(result[0].category_name).toEqual('Hukum Pidana');
  });

  it('should only return published documents', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create only unpublished document
    await db.insert(legalDocumentsTable)
      .values({
        ...unpublishedDocument,
        category_id: category.id
      })
      .execute();

    const result = await getDocumentsByCategory(category.id, 'id');

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent category', async () => {
    const result = await getDocumentsByCategory(999, 'id');

    expect(result).toHaveLength(0);
  });

  it('should handle multiple documents in same category', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create multiple published documents
    const document2 = {
      ...testDocument,
      title_id: 'Undang-Undang Kedua',
      title_en: 'Second Law',
      content_id: 'Konten kedua',
      content_en: 'Second content',
      document_number: 'UU-002-2023',
      category_id: category.id
    };

    await db.insert(legalDocumentsTable)
      .values([
        { ...testDocument, category_id: category.id },
        document2
      ])
      .execute();

    const result = await getDocumentsByCategory(category.id, 'id');

    expect(result).toHaveLength(2);
    expect(result.map(d => d.title)).toContain('Undang-Undang Pidana');
    expect(result.map(d => d.title)).toContain('Undang-Undang Kedua');
    expect(result.every(d => d.category_id === category.id)).toBe(true);
    expect(result.every(d => d.is_published === true)).toBe(true);
  });

  it('should handle documents with null summaries', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create document with null summaries
    const documentWithoutSummary = {
      ...testDocument,
      summary_id: null,
      summary_en: null,
      category_id: category.id
    };

    await db.insert(legalDocumentsTable)
      .values(documentWithoutSummary)
      .execute();

    const result = await getDocumentsByCategory(category.id, 'id');

    expect(result).toHaveLength(1);
    expect(result[0].summary).toBeNull();
  });

  it('should handle documents with empty tags array', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    const category = categoryResult[0];

    // Create document with empty tags
    const documentWithEmptyTags = {
      ...testDocument,
      tags: [],
      category_id: category.id
    };

    await db.insert(legalDocumentsTable)
      .values(documentWithEmptyTags)
      .execute();

    const result = await getDocumentsByCategory(category.id, 'id');

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
  });
});