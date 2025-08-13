import { db } from '../db';
import { legalDocumentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteLegalDocument(id: number): Promise<boolean> {
  try {
    // First check if the document exists
    const existingDocument = await db.select()
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, id))
      .execute();

    if (existingDocument.length === 0) {
      return false; // Document doesn't exist
    }

    // Permanently delete the document
    const result = await db.delete(legalDocumentsTable)
      .where(eq(legalDocumentsTable.id, id))
      .execute();

    // Drizzle returns an object with a rowCount property
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Legal document deletion failed:', error);
    throw error;
  }
}