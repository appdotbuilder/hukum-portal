import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type DocumentType, type Language, type LocalizedDocument } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getDocumentsByType(documentType: DocumentType, language: Language = 'id'): Promise<LocalizedDocument[]> {
  try {
    // Query documents with category information via join
    const results = await db.select()
      .from(legalDocumentsTable)
      .innerJoin(categoriesTable, eq(legalDocumentsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(legalDocumentsTable.document_type, documentType),
          eq(legalDocumentsTable.is_published, true)
        )
      )
      .execute();

    // Map results to localized format based on language
    return results.map(result => {
      const document = result.legal_documents;
      const category = result.categories;

      return {
        id: document.id,
        title: language === 'id' ? document.title_id : document.title_en,
        content: language === 'id' ? document.content_id : document.content_en,
        summary: language === 'id' ? document.summary_id : document.summary_en,
        document_type: document.document_type,
        category_id: document.category_id,
        category_name: language === 'id' ? category.name_id : category.name_en,
        document_number: document.document_number,
        publication_date: document.publication_date,
        effective_date: document.effective_date,
        tags: document.tags,
        file_url: document.file_url,
        is_published: document.is_published,
        created_at: document.created_at,
        updated_at: document.updated_at
      };
    });
  } catch (error) {
    console.error('Get documents by type failed:', error);
    throw error;
  }
}