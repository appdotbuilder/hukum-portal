import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';
import { type CreateCategoryInput } from '../schema';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories', async () => {
    // Create test categories
    const testCategories = [
      {
        name_id: 'Hukum Pidana',
        name_en: 'Criminal Law',
        description_id: 'Peraturan tentang hukum pidana',
        description_en: 'Regulations about criminal law'
      },
      {
        name_id: 'Hukum Perdata',
        name_en: 'Civil Law',
        description_id: 'Peraturan tentang hukum perdata',
        description_en: 'Regulations about civil law'
      }
    ];

    // Insert test categories
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    // Results should be ordered alphabetically by Indonesian name: "Hukum Perdata" comes before "Hukum Pidana"
    expect(result[0].name_id).toEqual('Hukum Perdata');
    expect(result[0].name_en).toEqual('Civil Law');
    expect(result[0].description_id).toEqual('Peraturan tentang hukum perdata');
    expect(result[0].description_en).toEqual('Regulations about civil law');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name_id).toEqual('Hukum Pidana');
    expect(result[1].name_en).toEqual('Criminal Law');
    expect(result[1].description_id).toEqual('Peraturan tentang hukum pidana');
    expect(result[1].description_en).toEqual('Regulations about criminal law');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    // Create category with null descriptions
    const testCategory = {
      name_id: 'Kategori Test',
      name_en: 'Test Category',
      description_id: null,
      description_en: null
    };

    await db.insert(categoriesTable)
      .values([testCategory])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name_id).toEqual('Kategori Test');
    expect(result[0].name_en).toEqual('Test Category');
    expect(result[0].description_id).toBeNull();
    expect(result[0].description_en).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by Indonesian name', async () => {
    // Create categories in different order than expected result
    const testCategories = [
      {
        name_id: 'Zakat',
        name_en: 'Zakat',
        description_id: 'Peraturan zakat',
        description_en: 'Zakat regulations'
      },
      {
        name_id: 'Administrasi',
        name_en: 'Administration',
        description_id: 'Hukum administrasi',
        description_en: 'Administrative law'
      },
      {
        name_id: 'Pajak',
        name_en: 'Tax',
        description_id: 'Peraturan pajak',
        description_en: 'Tax regulations'
      }
    ];

    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    // Should be ordered by Indonesian name: Administrasi, Pajak, Zakat
    expect(result[0].name_id).toEqual('Administrasi');
    expect(result[1].name_id).toEqual('Pajak');
    expect(result[2].name_id).toEqual('Zakat');
  });

  it('should return categories with different created_at timestamps', async () => {
    // Create first category
    await db.insert(categoriesTable)
      .values([{
        name_id: 'Kategori Pertama',
        name_en: 'First Category',
        description_id: null,
        description_en: null
      }])
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second category
    await db.insert(categoriesTable)
      .values([{
        name_id: 'Kategori Kedua',
        name_en: 'Second Category',
        description_id: null,
        description_en: null
      }])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    // Verify all categories have created_at timestamps
    result.forEach(category => {
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.created_at).toBeDefined();
    });

    // Verify they have different timestamps (within reasonable bounds)
    const firstTimestamp = result.find(c => c.name_id === 'Kategori Pertama')?.created_at;
    const secondTimestamp = result.find(c => c.name_id === 'Kategori Kedua')?.created_at;
    
    expect(firstTimestamp).toBeDefined();
    expect(secondTimestamp).toBeDefined();
    expect(firstTimestamp).not.toEqual(secondTimestamp);
  });

  it('should preserve all field types correctly', async () => {
    // Create comprehensive test category
    const testCategory = {
      name_id: 'Test Field Types',
      name_en: 'Test Field Types English',
      description_id: 'Indonesian description with special chars: àáâãäå',
      description_en: 'English description with numbers: 123456'
    };

    await db.insert(categoriesTable)
      .values([testCategory])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    // Verify field types
    expect(typeof category.id).toBe('number');
    expect(typeof category.name_id).toBe('string');
    expect(typeof category.name_en).toBe('string');
    expect(typeof category.description_id).toBe('string');
    expect(typeof category.description_en).toBe('string');
    expect(category.created_at).toBeInstanceOf(Date);

    // Verify special characters are preserved
    expect(category.description_id).toEqual('Indonesian description with special chars: àáâãäå');
    expect(category.description_en).toEqual('English description with numbers: 123456');
  });
});