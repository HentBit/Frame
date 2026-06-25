export default async function bookRoutesV2(fastify) {
  fastify.get("/api/v2/items", async (request) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;
    return fastify.bookCacheService.listBooksCached(page, limit);
  });

  fastify.post("/api/v2/items", async (request, reply) => {
    const newBook = await fastify.bookCacheService.createBook(request.body);
    return reply.status(201).send(newBook);
  });

  fastify.patch("/api/v2/items/:id", async (request) => {
    return fastify.bookCacheService.updateBook(request.params.id, request.body);
  });

  fastify.delete("/api/v2/items/:id", async (request) => {
    return fastify.bookCacheService.deleteBook(request.params.id);
  });

  fastify.get("/api/v2/references", async () => {
    return fastify.referenceService.getReferences();
  });
}
