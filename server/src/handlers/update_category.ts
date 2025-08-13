import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    // First, check if the category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.name_id !== undefined) {
      updateData['name_id'] = input.name_id;
    }
    
    if (input.name_en !== undefined) {
      updateData['name_en'] = input.name_en;
    }
    
    if (input.description_id !== undefined) {
      updateData['description_id'] = input.description_id;
    }
    
    if (input.description_en !== undefined) {
      updateData['description_en'] = input.description_en;
    }

    // If no fields to update, return the existing category
    if (Object.keys(updateData).length === 0) {
      return existingCategory[0];
    }

    // Update the category
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};