import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createLegalDocumentInputSchema,
  updateLegalDocumentInputSchema,
  searchDocumentsInputSchema,
  getDocumentInputSchema,
  languageSchema,
  documentTypeSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createLegalDocument } from './handlers/create_legal_document';
import { getLegalDocument } from './handlers/get_legal_document';
import { updateLegalDocument } from './handlers/update_legal_document';
import { deleteLegalDocument } from './handlers/delete_legal_document';
import { searchDocuments } from './handlers/search_documents';
import { getDocumentsByCategory } from './handlers/get_documents_by_category';
import { getDocumentsByType } from './handlers/get_documents_by_type';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category management endpoints
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCategory(input.id)),

  // Legal document management endpoints
  createLegalDocument: publicProcedure
    .input(createLegalDocumentInputSchema)
    .mutation(({ input }) => createLegalDocument(input)),

  getLegalDocument: publicProcedure
    .input(getDocumentInputSchema)
    .query(({ input }) => getLegalDocument(input)),

  updateLegalDocument: publicProcedure
    .input(updateLegalDocumentInputSchema)
    .mutation(({ input }) => updateLegalDocument(input)),

  deleteLegalDocument: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteLegalDocument(input.id)),

  // Document search and browsing endpoints
  searchDocuments: publicProcedure
    .input(searchDocumentsInputSchema)
    .query(({ input }) => searchDocuments(input)),

  getDocumentsByCategory: publicProcedure
    .input(z.object({ 
      categoryId: z.number(), 
      language: languageSchema.default('id') 
    }))
    .query(({ input }) => getDocumentsByCategory(input.categoryId, input.language)),

  getDocumentsByType: publicProcedure
    .input(z.object({ 
      documentType: documentTypeSchema, 
      language: languageSchema.default('id') 
    }))
    .query(({ input }) => getDocumentsByType(input.documentType, input.language)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Legal Documents Portal TRPC server listening at port: ${port}`);
}

start();