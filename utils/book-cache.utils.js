import { REDIS_KEYS, getItemsCacheKey } from "./redis-keys.js";

export function createBookCacheService({ db, redis, bookRepository }) {
  async function invalidateCache() {
    const keys = await redis.keys(`${REDIS_KEYS.ITEMS_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  return {
    async listBooksCached(page = 1, limit = 10) {
      const cacheKey = getItemsCacheKey(page, limit);
      const cached = await redis.get(cacheKey);

      if (cached !== null) {
        return JSON.parse(cached);
      }

      const offset = (page - 1) * limit;
      const books = await bookRepository.findPage(limit, offset);

      await redis.set(cacheKey, JSON.stringify(books), "EX", 86400);
      return books;
    },

    async createBook(data) {
      const newBook = await bookRepository.create(data);
      await invalidateCache();
      return newBook;
    },

    async updateBook(id, data) {
      const updatedBook = await bookRepository.update(id, data);
      await invalidateCache();
      return updatedBook;
    },

    async deleteBook(id) {
      const deleted = await bookRepository.delete(id);
      await invalidateCache();
      return deleted;
    }
  };
}