import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCategoryInput = {
  name_id: 'Hukum Pidana',
  name_en: 'Criminal Law',
  description_id: 'Kategori untuk dokumen hukum pidana',
  description_en: 'Category for criminal law documents'
};

// Test input with minimal required fields
const minimalInput: CreateCategoryInput = {
  name_id: 'Kategori Minimal',
  name_en: 'Minimal Category',
  description_id: null,
  description_en: null
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name_id).toEqual('Hukum Pidana');
    expect(result.name_en).toEqual('Criminal Law');
    expect(result.description_id).toEqual('Kategori untuk dokumen hukum pidana');
    expect(result.description_en).toEqual('Category for criminal law documents');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a category with minimal fields', async () => {
    const result = await createCategory(minimalInput);

    // Validate required fields
    expect(result.name_id).toEqual('Kategori Minimal');
    expect(result.name_en).toEqual('Minimal Category');
    expect(result.description_id).toBeNull();
    expect(result.description_en).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name_id).toEqual('Hukum Pidana');
    expect(categories[0].name_en).toEqual('Criminal Law');
    expect(categories[0].description_id).toEqual('Kategori untuk dokumen hukum pidana');
    expect(categories[0].description_en).toEqual('Category for criminal law documents');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with unique IDs', async () => {
    const category1 = await createCategory(testInput);
    const category2 = await createCategory(minimalInput);

    // Ensure unique IDs
    expect(category1.id).not.toEqual(category2.id);
    expect(category1.id).toBeGreaterThan(0);
    expect(category2.id).toBeGreaterThan(0);

    // Verify both exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    
    const ids = allCategories.map(cat => cat.id);
    expect(ids).toContain(category1.id);
    expect(ids).toContain(category2.id);
  });

  it('should handle special characters in names and descriptions', async () => {
    const specialInput: CreateCategoryInput = {
      name_id: 'Hukum & Peraturan Pemerintah No. 123/2023',
      name_en: 'Law & Government Regulation No. 123/2023',
      description_id: 'Kategori untuk "hukum khusus" dengan karakter spesial: @#$%',
      description_en: 'Category for "special laws" with special characters: @#$%'
    };

    const result = await createCategory(specialInput);

    expect(result.name_id).toEqual('Hukum & Peraturan Pemerintah No. 123/2023');
    expect(result.name_en).toEqual('Law & Government Regulation No. 123/2023');
    expect(result.description_id).toEqual('Kategori untuk "hukum khusus" dengan karakter spesial: @#$%');
    expect(result.description_en).toEqual('Category for "special laws" with special characters: @#$%');
  });

  it('should handle long text content', async () => {
    const longInput: CreateCategoryInput = {
      name_id: 'Kategori dengan nama yang sangat panjang untuk menguji batas panjang teks',
      name_en: 'Category with very long name to test text length limits',
      description_id: 'Ini adalah deskripsi yang sangat panjang untuk menguji apakah sistem dapat menangani teks yang panjang dengan baik. Deskripsi ini mencakup berbagai aspek dari kategori hukum yang kompleks dan memerlukan penjelasan yang detail.',
      description_en: 'This is a very long description to test whether the system can handle long text properly. This description covers various aspects of complex legal categories that require detailed explanation.'
    };

    const result = await createCategory(longInput);

    expect(result.name_id).toEqual(longInput.name_id);
    expect(result.name_en).toEqual(longInput.name_en);
    expect(result.description_id).toEqual(longInput.description_id);
    expect(result.description_en).toEqual(longInput.description_en);

    // Verify it was saved correctly to database
    const savedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(savedCategory[0].description_id).toEqual(longInput.description_id);
    expect(savedCategory[0].description_en).toEqual(longInput.description_en);
  });
});