import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateLegalDocumentInput, type LegalDocument } from '../schema';

export const createLegalDocument = async (input: CreateLegalDocumentInput): Promise<LegalDocument> => {
  try {
    // Verify that the referenced category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Insert legal document record
    const result = await db.insert(legalDocumentsTable)
      .values({
        title_id: input.title_id,
        title_en: input.title_en,
        content_id: input.content_id,
        content_en: input.content_en,
        summary_id: input.summary_id,
        summary_en: input.summary_en,
        document_type: input.document_type,
        category_id: input.category_id,
        document_number: input.document_number,
        publication_date: input.publication_date,
        effective_date: input.effective_date,
        tags: input.tags,
        file_url: input.file_url,
        is_published: input.is_published,
        updated_at: new Date()
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Legal document creation failed:', error);
    throw error;
  }
};