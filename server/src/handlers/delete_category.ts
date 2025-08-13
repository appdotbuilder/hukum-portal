import { db } from '../db';
import { categoriesTable, legalDocumentsTable } from '../db/schema';
import { eq, count } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    // First check if category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${id} not found`);
    }

    // Check if category has associated documents
    const documentCount = await db.select({ count: count() })
      .from(legalDocumentsTable)
      .where(eq(legalDocumentsTable.category_id, id))
      .execute();

    if (documentCount[0].count > 0) {
      throw new Error(`Cannot delete category with id ${id}. Category has ${documentCount[0].count} associated documents. Please reassign or delete the documents first.`);
    }

    // Delete the category if no documents are associated
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};