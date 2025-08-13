import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput, type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Helper function to create a test category
const createTestCategory = async (): Promise<number> => {
  const testCategory: CreateCategoryInput = {
    name_id: 'Kategori Test',
    name_en: 'Test Category',
    description_id: 'Deskripsi kategori test',
    description_en: 'Test category description'
  };

  const result = await db.insert(categoriesTable)
    .values(testCategory)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all category fields', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name_id: 'Kategori Diperbarui',
      name_en: 'Updated Category',
      description_id: 'Deskripsi yang diperbarui',
      description_en: 'Updated description'
    };

    const result = await updateCategory(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual('Kategori Diperbarui');
    expect(result.name_en).toEqual('Updated Category');
    expect(result.description_id).toEqual('Deskripsi yang diperbarui');
    expect(result.description_en).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    // Update only the English name
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name_en: 'Partially Updated Category'
    };

    const result = await updateCategory(updateInput);

    // Verify only specified field was updated, others remain unchanged
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual('Kategori Test'); // Original value
    expect(result.name_en).toEqual('Partially Updated Category'); // Updated
    expect(result.description_id).toEqual('Deskripsi kategori test'); // Original value
    expect(result.description_en).toEqual('Test category description'); // Original value
  });

  it('should update descriptions to null', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      description_id: null,
      description_en: null
    };

    const result = await updateCategory(updateInput);

    // Verify descriptions were set to null
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual('Kategori Test'); // Original value
    expect(result.name_en).toEqual('Test Category'); // Original value
    expect(result.description_id).toBeNull();
    expect(result.description_en).toBeNull();
  });

  it('should save changes to database', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name_id: 'Kategori Database Test',
      name_en: 'Database Test Category'
    };

    await updateCategory(updateInput);

    // Verify changes were persisted in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name_id).toEqual('Kategori Database Test');
    expect(categories[0].name_en).toEqual('Database Test Category');
    expect(categories[0].description_id).toEqual('Deskripsi kategori test'); // Unchanged
    expect(categories[0].description_en).toEqual('Test category description'); // Unchanged
  });

  it('should return unchanged category when no fields provided', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    // Get original category for comparison
    const originalCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: categoryId
      // No fields to update
    };

    const result = await updateCategory(updateInput);

    // Should return the original category unchanged
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual(originalCategory[0].name_id);
    expect(result.name_en).toEqual(originalCategory[0].name_en);
    expect(result.description_id).toEqual(originalCategory[0].description_id);
    expect(result.description_en).toEqual(originalCategory[0].description_en);
    expect(result.created_at).toEqual(originalCategory[0].created_at);
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 99999, // Non-existent category ID
      name_id: 'Should Fail'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/Category with id 99999 not found/i);
  });

  it('should handle updating to empty strings', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name_id: 'New Indonesian Name',
      name_en: 'New English Name',
      description_id: '', // Empty string
      description_en: ''  // Empty string
    };

    const result = await updateCategory(updateInput);

    // Verify empty strings are stored (not converted to null)
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual('New Indonesian Name');
    expect(result.name_en).toEqual('New English Name');
    expect(result.description_id).toEqual('');
    expect(result.description_en).toEqual('');
  });

  it('should handle mixed updates with null and non-null values', async () => {
    // Create a test category first
    const categoryId = await createTestCategory();

    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name_id: 'Mixed Update Indonesian',
      description_id: null, // Set to null
      description_en: 'Mixed update English description' // Keep non-null
    };

    const result = await updateCategory(updateInput);

    // Verify mixed update
    expect(result.id).toEqual(categoryId);
    expect(result.name_id).toEqual('Mixed Update Indonesian');
    expect(result.name_en).toEqual('Test Category'); // Original value
    expect(result.description_id).toBeNull(); // Updated to null
    expect(result.description_en).toEqual('Mixed update English description'); // Updated
  });
});