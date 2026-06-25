import fp from "fastify-plugin";
import { BookModel } from "../db/models/book.model.js";

async function bookRepositoryPlugin(fastify) {
  const repository = {
    findAll: async () => {
      return await BookModel.find().lean();
    },
    findById: async (id) => {
      return await BookModel.findById(id).lean();
    },
    create: async (data) => {
      return await BookModel.create(data);
    },
    update: async (id, data) => {
      return await BookModel.findByIdAndUpdate(id, data, { new: true }).lean();
    },
    delete: async (id) => {
      const result = await BookModel.findByIdAndDelete(id);
      return !!result;
    }
  };

  fastify.decorate("bookRepository", repository);
}

export default fp(bookRepositoryPlugin, {
  name: "book-repository-plugin"
});
