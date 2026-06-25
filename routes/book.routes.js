import bookController from "#controllers/book.controller";
import {
  getBooksSchema,
  createBookSchema,
  updateBookSchema
} from "#schemas/book.schema";

export default async function bookRoutes(fastify) {
  fastify.get("/health", bookController.getHealth);
  fastify.get(
    "/health/details",
    {
      onRequest: async (request, reply) => {
        const apiKey = request.headers["x-api-key"];
        if (!apiKey || apiKey !== fastify.config.ADMIN_API_KEY)
          throw reply.unauthorized();
      }
    },
    bookController.getHealthDetails
  );

  fastify.get("/books", { schema: getBooksSchema }, bookController.getBooks);
  fastify.post(
    "/books",
    { schema: createBookSchema },
    bookController.createBook
  );
  fastify.patch(
    "/books/:id",
    { schema: updateBookSchema },
    bookController.patchBook
  );
  fastify.delete("/books/:id", bookController.deleteBook);

  fastify.get("/books/export", bookController.exportCSV);
  fastify.post("/books/import", bookController.importData);
  fastify.post("/books/:id/image", bookController.uploadImage);
}
