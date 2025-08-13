import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { getDocumentsByType } from '../handlers/get_documents_by_type';

describe('getDocumentsByType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return documents of specified type in Indonesian', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Kategori Hukum',
        name_en: 'Legal Category',
        description_id: 'Deskripsi kategori hukum',
        description_en: 'Legal category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test documents
    await db.insert(legalDocumentsTable)
      .values([
        {
          title_id: 'Artikel Hukum 1',
          title_en: 'Legal Article 1',
          content_id: 'Konten artikel hukum dalam bahasa Indonesia',
          content_en: 'Legal article content in English',
          summary_id: 'Ringkasan artikel',
          summary_en: 'Article summary',
          document_type: 'article',
          category_id: categoryId,
          document_number: null,
          publication_date: new Date('2023-01-15'),
          effective_date: null,
          tags: ['hukum', 'artikel'],
          file_url: null,
          is_published: true
        },
        {
          title_id: 'Undang-undang 1',
          title_en: 'Law 1',
          content_id: 'Isi undang-undang dalam bahasa Indonesia',
          content_en: 'Law content in English',
          summary_id: null,
          summary_en: null,
          document_type: 'law',
          category_id: categoryId,
          document_number: 'UU-001/2023',
          publication_date: new Date('2023-02-01'),
          effective_date: new Date('2023-03-01'),
          tags: ['undang-undang', 'hukum'],
          file_url: 'https://example.com/law1.pdf',
          is_published: true
        },
        {
          title_id: 'Artikel Hukum 2',
          title_en: 'Legal Article 2',
          content_id: 'Konten artikel kedua',
          content_en: 'Second article content',
          summary_id: 'Ringkasan kedua',
          summary_en: 'Second summary',
          document_type: 'article',
          category_id: categoryId,
          document_number: null,
          publication_date: new Date('2023-01-20'),
          effective_date: null,
          tags: ['artikel'],
          file_url: null,
          is_published: false // Not published
        }
      ])
      .execute();

    const results = await getDocumentsByType('article', 'id');

    // Should only return published articles
    expect(results).toHaveLength(1);
    
    const document = results[0];
    expect(document.title).toEqual('Artikel Hukum 1');
    expect(document.content).toEqual('Konten artikel hukum dalam bahasa Indonesia');
    expect(document.summary).toEqual('Ringkasan artikel');
    expect(document.document_type).toEqual('article');
    expect(document.category_name).toEqual('Kategori Hukum');
    expect(document.tags).toEqual(['hukum', 'artikel']);
    expect(document.is_published).toBe(true);
    expect(document.id).toBeDefined();
    expect(document.created_at).toBeInstanceOf(Date);
    expect(document.updated_at).toBeInstanceOf(Date);
  });

  it('should return documents in English when language is en', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Kategori Hukum',
        name_en: 'Legal Category',
        description_id: 'Deskripsi kategori hukum',
        description_en: 'Legal category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test document
    await db.insert(legalDocumentsTable)
      .values({
        title_id: 'Artikel Hukum',
        title_en: 'Legal Article',
        content_id: 'Konten dalam bahasa Indonesia',
        content_en: 'Content in English',
        summary_id: 'Ringkasan bahasa Indonesia',
        summary_en: 'English summary',
        document_type: 'law',
        category_id: categoryId,
        document_number: 'LAW-001',
        publication_date: new Date('2023-01-15'),
        effective_date: new Date('2023-02-15'),
        tags: ['law', 'legal'],
        file_url: 'https://example.com/law.pdf',
        is_published: true
      })
      .execute();

    const results = await getDocumentsByType('law', 'en');

    expect(results).toHaveLength(1);
    
    const document = results[0];
    expect(document.title).toEqual('Legal Article');
    expect(document.content).toEqual('Content in English');
    expect(document.summary).toEqual('English summary');
    expect(document.category_name).toEqual('Legal Category');
    expect(document.document_type).toEqual('law');
    expect(document.document_number).toEqual('LAW-001');
    expect(document.publication_date).toEqual(new Date('2023-01-15'));
    expect(document.effective_date).toEqual(new Date('2023-02-15'));
  });

  it('should return empty array when no published documents exist for type', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Kategori Test',
        name_en: 'Test Category',
        description_id: null,
        description_en: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create unpublished document
    await db.insert(legalDocumentsTable)
      .values({
        title_id: 'Dokumen Draft',
        title_en: 'Draft Document',
        content_id: 'Konten draft',
        content_en: 'Draft content',
        summary_id: null,
        summary_en: null,
        document_type: 'decision',
        category_id: categoryId,
        document_number: 'DRAFT-001',
        publication_date: null,
        effective_date: null,
        tags: ['draft'],
        file_url: null,
        is_published: false
      })
      .execute();

    const results = await getDocumentsByType('decision', 'id');

    expect(results).toHaveLength(0);
  });

  it('should filter by document type correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Kategori Mixed',
        name_en: 'Mixed Category',
        description_id: null,
        description_en: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create documents of different types
    await db.insert(legalDocumentsTable)
      .values([
        {
          title_id: 'Artikel 1',
          title_en: 'Article 1',
          content_id: 'Konten artikel',
          content_en: 'Article content',
          summary_id: null,
          summary_en: null,
          document_type: 'article',
          category_id: categoryId,
          document_number: null,
          publication_date: new Date('2023-01-01'),
          effective_date: null,
          tags: ['artikel'],
          file_url: null,
          is_published: true
        },
        {
          title_id: 'Keputusan 1',
          title_en: 'Decision 1',
          content_id: 'Konten keputusan',
          content_en: 'Decision content',
          summary_id: null,
          summary_en: null,
          document_type: 'decision',
          category_id: categoryId,
          document_number: 'KEP-001',
          publication_date: new Date('2023-01-02'),
          effective_date: new Date('2023-01-15'),
          tags: ['keputusan'],
          file_url: null,
          is_published: true
        },
        {
          title_id: 'Undang-undang 1',
          title_en: 'Law 1',
          content_id: 'Konten undang-undang',
          content_en: 'Law content',
          summary_id: null,
          summary_en: null,
          document_type: 'law',
          category_id: categoryId,
          document_number: 'UU-001',
          publication_date: new Date('2023-01-03'),
          effective_date: new Date('2023-02-01'),
          tags: ['undang-undang'],
          file_url: null,
          is_published: true
        }
      ])
      .execute();

    // Test article filter
    const articles = await getDocumentsByType('article', 'id');
    expect(articles).toHaveLength(1);
    expect(articles[0].document_type).toEqual('article');
    expect(articles[0].title).toEqual('Artikel 1');

    // Test decision filter  
    const decisions = await getDocumentsByType('decision', 'id');
    expect(decisions).toHaveLength(1);
    expect(decisions[0].document_type).toEqual('decision');
    expect(decisions[0].title).toEqual('Keputusan 1');
    expect(decisions[0].document_number).toEqual('KEP-001');

    // Test law filter
    const laws = await getDocumentsByType('law', 'id');
    expect(laws).toHaveLength(1);
    expect(laws[0].document_type).toEqual('law');
    expect(laws[0].title).toEqual('Undang-undang 1');
    expect(laws[0].document_number).toEqual('UU-001');
  });

  it('should handle null summary fields correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Kategori Null',
        name_en: 'Null Category',
        description_id: null,
        description_en: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create document with null summaries
    await db.insert(legalDocumentsTable)
      .values({
        title_id: 'Dokumen Tanpa Ringkasan',
        title_en: 'Document Without Summary',
        content_id: 'Konten lengkap',
        content_en: 'Full content',
        summary_id: null,
        summary_en: null,
        document_type: 'article',
        category_id: categoryId,
        document_number: null,
        publication_date: new Date('2023-01-01'),
        effective_date: null,
        tags: ['test'],
        file_url: null,
        is_published: true
      })
      .execute();

    const resultsId = await getDocumentsByType('article', 'id');
    expect(resultsId[0].summary).toBeNull();

    const resultsEn = await getDocumentsByType('article', 'en');
    expect(resultsEn[0].summary).toBeNull();
  });

  it('should default to Indonesian language when not specified', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name_id: 'Default Bahasa',
        name_en: 'Default Language',
        description_id: null,
        description_en: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test document
    await db.insert(legalDocumentsTable)
      .values({
        title_id: 'Judul Indonesia',
        title_en: 'English Title',
        content_id: 'Konten Indonesia',
        content_en: 'English Content',
        summary_id: 'Ringkasan Indonesia',
        summary_en: 'English Summary',
        document_type: 'article',
        category_id: categoryId,
        document_number: null,
        publication_date: new Date('2023-01-01'),
        effective_date: null,
        tags: ['default'],
        file_url: null,
        is_published: true
      })
      .execute();

    // Call without language parameter - should default to 'id'
    const results = await getDocumentsByType('article');

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Judul Indonesia');
    expect(results[0].content).toEqual('Konten Indonesia');
    expect(results[0].summary).toEqual('Ringkasan Indonesia');
    expect(results[0].category_name).toEqual('Default Bahasa');
  });
});