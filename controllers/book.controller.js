import bookRepository from "#repositories/book.repository";
import { MESSAGES } from "#constants/messages";

const bookController = {
  getHealth: async (request, reply) => {
    return reply.send({ status: "ok" });
  },

  getHealthDetails: async (request, reply) => {
    return reply.send({
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage()
    });
  },

  getBooks: async (request, reply) => {
    const { author } = request.query;
    let results = bookRepository.getAll();

    if (author) {
      results = results.filter(
        (book) => book.author.toLowerCase() === author.toLowerCase()
      );
    }

    return reply.send({ count: results.length, items: results });
  },

  createBook: async (request, reply) => {
    const newBook = bookRepository.create(request.body);
    return reply.status(201).send({ message: "Created", book: newBook });
  },

  patchBook: async (request, reply) => {
    const { id } = request.params;

    if (request.body.id !== undefined) {
      throw reply.badRequest(MESSAGES.FORBIDDEN_ID);
    }

    const updatedBook = bookRepository.update(id, request.body);
    if (!updatedBook) {
      throw reply.notFound(MESSAGES.NOT_FOUND);
    }

    return reply.send({ message: "Updated", book: updatedBook });
  },

  deleteBook: async (request, reply) => {
    const { id } = request.params;
    const isDeleted = bookRepository.delete(id);

    if (!isDeleted) {
      throw reply.notFound(MESSAGES.NOT_FOUND);
    }

    return reply.send({ message: "Deleted" });
  }
};

export default bookController;
