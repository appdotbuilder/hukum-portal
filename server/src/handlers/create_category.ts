import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type Category } from '../schema';

export const createCategory = async (input: CreateCategoryInput): Promise<Category> => {
  try {
    // Insert category record
    const result = await db.insert(categoriesTable)
      .values({
        name_id: input.name_id,
        name_en: input.name_en,
        description_id: input.description_id,
        description_en: input.description_en
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category creation failed:', error);
    throw error;
  }
};