export default async function bookRoutesV1(fastify) {
  fastify.get("/api/v1/items", async (request) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;
    return fastify.bookCacheService.listBooksCached(page, limit);
  });

  fastify.post(
    "/api/v1/items",
    { onRequest: [fastify.authenticateJwt] },
    async (request, reply) => {
      const newBook = await fastify.bookCacheService.createBook(request.body);
      return reply.status(201).send(newBook);
    }
  );

  fastify.patch(
    "/api/v1/items/:id",
    { onRequest: [fastify.authenticateJwt] },
    async (request) => {
      return fastify.bookCacheService.updateBook(
        request.params.id,
        request.body
      );
    }
  );

  fastify.delete(
    "/api/v1/items/:id",
    { onRequest: [fastify.authenticateJwt] },
    async (request) => {
      return fastify.bookCacheService.deleteBook(request.params.id);
    }
  );
}
