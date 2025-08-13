import { db } from '../db';
import { legalDocumentsTable, categoriesTable } from '../db/schema';
import { type SearchDocumentsInput, type SearchResults, type LocalizedDocument } from '../schema';
import { eq, and, or, ilike, sql, type SQL } from 'drizzle-orm';

export async function searchDocuments(input: SearchDocumentsInput): Promise<SearchResults> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by published status
    if (input.published_only) {
      conditions.push(eq(legalDocumentsTable.is_published, true));
    }

    // Filter by document type
    if (input.document_type) {
      conditions.push(eq(legalDocumentsTable.document_type, input.document_type));
    }

    // Filter by category
    if (input.category_id) {
      conditions.push(eq(legalDocumentsTable.category_id, input.category_id));
    }

    // Text search in title and content (language-specific)
    if (input.query && input.query.trim()) {
      const searchTerm = `%${input.query.trim()}%`;
      
      if (input.language === 'en') {
        conditions.push(
          or(
            ilike(legalDocumentsTable.title_en, searchTerm),
            ilike(legalDocumentsTable.content_en, searchTerm)
          )!
        );
      } else {
        // Default to Indonesian
        conditions.push(
          or(
            ilike(legalDocumentsTable.title_id, searchTerm),
            ilike(legalDocumentsTable.content_id, searchTerm)
          )!
        );
      }
    }

    // Filter by tags
    if (input.tags && input.tags.length > 0) {
      // Use PostgreSQL's JSON contains operator for array matching
      const tagConditions = input.tags.map(tag => 
        sql`${legalDocumentsTable.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      );
      
      if (tagConditions.length === 1) {
        conditions.push(tagConditions[0]);
      } else {
        conditions.push(or(...tagConditions)!);
      }
    }

    // Build base query with all conditions
    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Main query
    const baseQuery = db.select({
      id: legalDocumentsTable.id,
      title_id: legalDocumentsTable.title_id,
      title_en: legalDocumentsTable.title_en,
      content_id: legalDocumentsTable.content_id,
      content_en: legalDocumentsTable.content_en,
      summary_id: legalDocumentsTable.summary_id,
      summary_en: legalDocumentsTable.summary_en,
      document_type: legalDocumentsTable.document_type,
      category_id: legalDocumentsTable.category_id,
      category_name_id: categoriesTable.name_id,
      category_name_en: categoriesTable.name_en,
      document_number: legalDocumentsTable.document_number,
      publication_date: legalDocumentsTable.publication_date,
      effective_date: legalDocumentsTable.effective_date,
      tags: legalDocumentsTable.tags,
      file_url: legalDocumentsTable.file_url,
      is_published: legalDocumentsTable.is_published,
      created_at: legalDocumentsTable.created_at,
      updated_at: legalDocumentsTable.updated_at
    })
    .from(legalDocumentsTable)
    .innerJoin(categoriesTable, eq(legalDocumentsTable.category_id, categoriesTable.id));

    const query = whereClause 
      ? baseQuery.where(whereClause).limit(input.limit).offset(input.offset)
      : baseQuery.limit(input.limit).offset(input.offset);

    // Count query
    const baseCountQuery = db.select({ count: sql<string>`count(*)` })
      .from(legalDocumentsTable)
      .innerJoin(categoriesTable, eq(legalDocumentsTable.category_id, categoriesTable.id));

    const countQuery = whereClause 
      ? baseCountQuery.where(whereClause)
      : baseCountQuery;

    // Execute both queries
    const [results, countResults] = await Promise.all([
      query.execute(),
      countQuery.execute()
    ]);

    const totalCount = parseInt(countResults[0].count);

    // Transform results to localized documents
    const localizedDocuments: LocalizedDocument[] = results.map(result => {
      const isEnglish = input.language === 'en';
      
      return {
        id: result.id,
        title: isEnglish ? result.title_en : result.title_id,
        content: isEnglish ? result.content_en : result.content_id,
        summary: isEnglish ? result.summary_en : result.summary_id,
        document_type: result.document_type,
        category_id: result.category_id,
        category_name: isEnglish ? result.category_name_en : result.category_name_id,
        document_number: result.document_number,
        publication_date: result.publication_date,
        effective_date: result.effective_date,
        tags: result.tags as string[],
        file_url: result.file_url,
        is_published: result.is_published,
        created_at: result.created_at,
        updated_at: result.updated_at
      };
    });

    return {
      documents: localizedDocuments,
      total_count: totalCount,
      has_more: (input.offset + input.limit) < totalCount
    };

  } catch (error) {
    console.error('Document search failed:', error);
    throw error;
  }
}