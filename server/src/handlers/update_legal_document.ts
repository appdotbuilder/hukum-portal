import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type UpdateLegalDocumentInput, type LegalDocument } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLegalDocument = async (input: UpdateLegalDocumentInput): Promise<LegalDocument> => {
  try {
    // Verify the document exists
    const existingDocument = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, input.id))
      .execute();

    if (existingDocument.length === 0) {
      throw new Error(`Legal document with id ${input.id} not found`);
    }

    // If category_id is being updated, verify the category exists
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.title_id !== undefined) updateData['title_id'] = input.title_id;
    if (input.title_en !== undefined) updateData['title_en'] = input.title_en;
    if (input.content_id !== undefined) updateData['content_id'] = input.content_id;
    if (input.content_en !== undefined) updateData['content_en'] = input.content_en;
    if (input.summary_id !== undefined) updateData['summary_id'] = input.summary_id;
    if (input.summary_en !== undefined) updateData['summary_en'] = input.summary_en;
    if (input.document_type !== undefined) updateData['document_type'] = input.document_type;
    if (input.category_id !== undefined) updateData['category_id'] = input.category_id;
    if (input.document_number !== undefined) updateData['document_number'] = input.document_number;
    if (input.publication_date !== undefined) updateData['publication_date'] = input.publication_date;
    if (input.effective_date !== undefined) updateData['effective_date'] = input.effective_date;
    if (input.tags !== undefined) updateData['tags'] = input.tags;
    if (input.file_url !== undefined) updateData['file_url'] = input.file_url;
    if (input.is_published !== undefined) updateData['is_published'] = input.is_published;

    // Update the document
    const result = await db.update(legalDocumentsTable)
      .set(updateData)
      .where(eq(legalDocumentsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Legal document update failed:', error);
    throw error;
  }
};