import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type GetDocumentInput, type LocalizedDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const getLegalDocument = async (input: GetDocumentInput): Promise<LocalizedDocument> => {
  try {
    // Query document with joined category data
    const results = await db.select()
      .from(legalDocumentsTable)
      .innerJoin(categoriesTable, eq(legalDocumentsTable.category_id, categoriesTable.id))
      .where(eq(legalDocumentsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Legal document with id ${input.id} not found`);
    }

    const result = results[0];
    const document = result.legal_documents;
    const category = result.categories;

    // Return localized data based on requested language
    return {
      id: document.id,
      title: input.language === 'en' ? document.title_en : document.title_id,
      content: input.language === 'en' ? document.content_en : document.content_id,
      summary: input.language === 'en' ? document.summary_en : document.summary_id,
      document_type: document.document_type,
      category_id: document.category_id,
      category_name: input.language === 'en' ? category.name_en : category.name_id,
      document_number: document.document_number,
      publication_date: document.publication_date,
      effective_date: document.effective_date,
      tags: document.tags || [],
      file_url: document.file_url,
      is_published: document.is_published,
      created_at: document.created_at,
      updated_at: document.updated_at
    };
  } catch (error) {
    console.error('Failed to get legal document:', error);
    throw error;
  }
};