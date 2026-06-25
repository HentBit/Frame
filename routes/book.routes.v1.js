import bookController from "#controllers/book.controller";
import { getBooksSchema, createBookSchema, updateBookSchema, getBookDetailsSchema } from "#schemas/book.schema";

export default async function bookRoutesV1(fastify) {
  fastify.get("/health", bookController.getHealth);
  fastify.get("/books", { schema: getBooksSchema }, bookController.getBooks);
  
  // 1. Потоковий NDJSON маршрут (Пункт 4)
  fastify.get("/books/stream", bookController.streamBooks);
  
  fastify.get("/books/:id/details", { schema: getBookDetailsSchema }, bookController.getBookDetails);
  fastify.post("/books", { schema: createBookSchema }, bookController.createBook);
  fastify.patch("/books/:id", { schema: updateBookSchema }, bookController.patchBook);
  fastify.delete("/books/:id", bookController.deleteBook);
  fastify.get("/books/export", bookController.exportCSV);
  fastify.post("/books/import", bookController.importData);
  fastify.post("/books/:id/image", bookController.uploadImage);
  
  fastify.get("/backups/:timestamp", bookController.getBackupFile);

  fastify.get("/github/shared-repos", bookController.getSharedReposV1);
}