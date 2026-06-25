export default async function bookRoutes(fastify) {
  // Роут перевірки здоров'я (health check) — прибрали невикористані request/reply
  fastify.get("/health/details", async () => {
    return { status: "OK", database: "connected" };
  });

  // Роут для отримання всіх книг — прибрали невикористані request/reply
  fastify.get("/books", async () => {
    const books = await fastify.bookRepository.findAll();
    return books;
  });

  fastify.get("/books/:id", async (request, reply) => {
    const { id } = request.params;
    const book = await fastify.bookRepository.findById(id);
    if (!book) {
      return reply.notFound("Книгу не знайдено");
    }
    return book;
  });

  fastify.post("/books", async (request, reply) => {
    const newBook = await fastify.bookRepository.create(request.body);
    return reply.status(201).send(newBook);
  });

  fastify.put("/books/:id", async (request, reply) => {
    const { id } = request.params;
    const updatedBook = await fastify.bookRepository.update(id, request.body);
    if (!updatedBook) {
      return reply.notFound("Книгу не знайдено для оновлення");
    }
    return updatedBook;
  });

  fastify.delete("/books/:id", async (request, reply) => {
    const { id } = request.params;
    const deleted = await fastify.bookRepository.delete(id);
    if (!deleted) {
      return reply.notFound("Книгу не знайдено для видалення");
    }
    return { success: true };
  });
}
