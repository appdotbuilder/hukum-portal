import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { asc } from 'drizzle-orm';

export async function getCategories(): Promise<Category[]> {
  try {
    // Fetch all categories from the database, ordered by Indonesian name
    const results = await db.select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name_id))
      .execute();

    // Return the categories (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}