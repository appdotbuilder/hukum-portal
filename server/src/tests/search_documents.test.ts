import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type SearchDocumentsInput } from '../schema';
import { searchDocuments } from '../handlers/search_documents';

describe('searchDocuments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test category
  const createTestCategory = async () => {
    const [category] = await db.insert(categoriesTable)
      .values({
        name_id: 'Hukum Pidana',
        name_en: 'Criminal Law',
        description_id: 'Kategori hukum pidana',
        description_en: 'Criminal law category'
      })
      .returning()
      .execute();
    return category;
  };

  // Helper function to create test documents
  const createTestDocuments = async (categoryId: number) => {
    const documents = [
      {
        title_id: 'Undang-Undang Korupsi',
        title_en: 'Corruption Law',
        content_id: 'Isi undang-undang tentang korupsi dan tindak pidana korupsi',
        content_en: 'Content about corruption law and criminal corruption acts',
        summary_id: 'Ringkasan UU Korupsi',
        summary_en: 'Corruption Law Summary',
        document_type: 'law' as const,
        category_id: categoryId,
        document_number: 'UU No. 31 Tahun 1999',
        publication_date: new Date('2023-01-01'),
        effective_date: new Date('2023-01-15'),
        tags: ['korupsi', 'pidana', 'hukum'],
        file_url: 'https://example.com/corruption-law.pdf',
        is_published: true
      },
      {
        title_id: 'Artikel Pencegahan Korupsi',
        title_en: 'Corruption Prevention Article',
        content_id: 'Artikel tentang cara mencegah korupsi di Indonesia',
        content_en: 'Article about preventing corruption in Indonesia',
        summary_id: 'Cara mencegah korupsi',
        summary_en: 'How to prevent corruption',
        document_type: 'article' as const,
        category_id: categoryId,
        document_number: null,
        publication_date: new Date('2023-02-01'),
        effective_date: null,
        tags: ['korupsi', 'pencegahan'],
        file_url: null,
        is_published: true
      },
      {
        title_id: 'Putusan Mahkamah Agung',
        title_en: 'Supreme Court Decision',
        content_id: 'Putusan MA tentang kasus korupsi besar',
        content_en: 'Supreme Court decision on major corruption case',
        summary_id: null,
        summary_en: null,
        document_type: 'decision' as const,
        category_id: categoryId,
        document_number: 'Putusan No. 123/2023',
        publication_date: new Date('2023-03-01'),
        effective_date: new Date('2023-03-01'),
        tags: ['putusan', 'mahkamah', 'korupsi'],
        file_url: 'https://example.com/decision.pdf',
        is_published: false // Not published
      }
    ];

    return await db.insert(legalDocumentsTable)
      .values(documents)
      .returning()
      .execute();
  };

  it('should return all published documents with default parameters', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2); // Only published documents
    expect(result.total_count).toBe(2);
    expect(result.has_more).toBe(false);
    
    // Check localization (default to Indonesian)
    expect(result.documents[0].title).toBe('Undang-Undang Korupsi');
    expect(result.documents[0].category_name).toBe('Hukum Pidana');
    expect(result.documents[0].content).toBe('Isi undang-undang tentang korupsi dan tindak pidana korupsi');
    
    // Verify all returned documents are published
    result.documents.forEach(doc => {
      expect(doc.is_published).toBe(true);
    });
  });

  it('should return English localized results when language is en', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      language: 'en',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].title).toBe('Corruption Law');
    expect(result.documents[0].category_name).toBe('Criminal Law');
    expect(result.documents[0].content).toBe('Content about corruption law and criminal corruption acts');
  });

  it('should search by query in Indonesian', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      query: 'korupsi',
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    expect(result.total_count).toBe(2);
    
    // Should find documents containing 'korupsi' in title or content
    result.documents.forEach(doc => {
      const hasInTitle = doc.title.toLowerCase().includes('korupsi');
      const hasInContent = doc.content.toLowerCase().includes('korupsi');
      expect(hasInTitle || hasInContent).toBe(true);
    });
  });

  it('should search by query in English', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      query: 'corruption',
      language: 'en',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    
    // Should find documents containing 'corruption' in English title or content
    result.documents.forEach(doc => {
      const hasInTitle = doc.title.toLowerCase().includes('corruption');
      const hasInContent = doc.content.toLowerCase().includes('corruption');
      expect(hasInTitle || hasInContent).toBe(true);
    });
  });

  it('should filter by document type', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      document_type: 'law',
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].document_type).toBe('law');
    expect(result.documents[0].title).toBe('Undang-Undang Korupsi');
  });

  it('should filter by category', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      category_id: category.id,
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    result.documents.forEach(doc => {
      expect(doc.category_id).toBe(category.id);
    });
  });

  it('should filter by tags', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      tags: ['pencegahan'],
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].title).toBe('Artikel Pencegahan Korupsi');
    expect(result.documents[0].tags).toContain('pencegahan');
  });

  it('should filter by multiple tags', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      tags: ['korupsi', 'mahkamah'],
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(2);
    
    // Should include documents that have either 'korupsi' OR 'mahkamah' tag
    // Since we created 2 published docs with 'korupsi' and 1 unpublished with 'mahkamah'
    // Only the published ones with 'korupsi' should be returned
    result.documents.forEach(doc => {
      expect(doc.tags.some(tag => ['korupsi', 'mahkamah'].includes(tag))).toBe(true);
    });
  });

  it('should include unpublished documents when published_only is false', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      published_only: false,
      language: 'id',
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(3); // All documents including unpublished
    expect(result.total_count).toBe(3);
    
    // Should include the unpublished document
    const unpublishedDoc = result.documents.find(doc => !doc.is_published);
    expect(unpublishedDoc).toBeDefined();
    expect(unpublishedDoc?.title).toBe('Putusan Mahkamah Agung');
  });

  it('should handle pagination correctly', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    // First page
    const input1: SearchDocumentsInput = {
      limit: 1,
      offset: 0,
      language: 'id',
      published_only: true
    };
    const result1 = await searchDocuments(input1);

    expect(result1.documents).toHaveLength(1);
    expect(result1.total_count).toBe(2);
    expect(result1.has_more).toBe(true);

    // Second page
    const input2: SearchDocumentsInput = {
      limit: 1,
      offset: 1,
      language: 'id',
      published_only: true
    };
    const result2 = await searchDocuments(input2);

    expect(result2.documents).toHaveLength(1);
    expect(result2.total_count).toBe(2);
    expect(result2.has_more).toBe(false);

    // Should return different documents
    expect(result1.documents[0].id).not.toBe(result2.documents[0].id);
  });

  it('should combine multiple filters', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      query: 'korupsi',
      document_type: 'law',
      category_id: category.id,
      tags: ['korupsi'],
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].document_type).toBe('law');
    expect(result.documents[0].category_id).toBe(category.id);
    expect(result.documents[0].tags).toContain('korupsi');
    expect(result.documents[0].title.toLowerCase()).toContain('korupsi');
  });

  it('should return empty results when no documents match', async () => {
    const category = await createTestCategory();
    await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      query: 'nonexistent',
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(0);
    expect(result.total_count).toBe(0);
    expect(result.has_more).toBe(false);
  });

  it('should handle empty database', async () => {
    const input: SearchDocumentsInput = {
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    expect(result.documents).toHaveLength(0);
    expect(result.total_count).toBe(0);
    expect(result.has_more).toBe(false);
  });

  it('should preserve document metadata correctly', async () => {
    const category = await createTestCategory();
    const createdDocs = await createTestDocuments(category.id);

    const input: SearchDocumentsInput = {
      document_type: 'law',
      language: 'id',
      published_only: true,
      limit: 20,
      offset: 0
    };
    const result = await searchDocuments(input);

    const doc = result.documents[0];
    const originalDoc = createdDocs.find(d => d.document_type === 'law')!;

    expect(doc.id).toBe(originalDoc.id);
    expect(doc.document_number).toBe('UU No. 31 Tahun 1999');
    expect(doc.publication_date).toEqual(originalDoc.publication_date);
    expect(doc.effective_date).toEqual(originalDoc.effective_date);
    expect(doc.file_url).toBe('https://example.com/corruption-law.pdf');
    expect(doc.is_published).toBe(true);
    expect(doc.tags).toEqual(['korupsi', 'pidana', 'hukum']);
    expect(doc.created_at).toBeInstanceOf(Date);
    expect(doc.updated_at).toBeInstanceOf(Date);
  });
});