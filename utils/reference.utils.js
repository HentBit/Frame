import { REDIS_KEYS } from "./redis-keys.js";

export function createReferenceService({ redis }) {
  return {
    async getReferences() {
      const cachedData = await redis.get(REDIS_KEYS.REFERENCE_CACHE);

      if (cachedData !== null) {
        return JSON.parse(cachedData);
      }

      const freshData = {
        categories: ["Fiction", "Science", "History"],
        currencies: ["USD", "EUR", "UAH"],
        updatedAt: new Date().toISOString()
      };

      await redis.set(
        REDIS_KEYS.REFERENCE_CACHE,
        JSON.stringify(freshData),
        "EX",
        120
      );

      return freshData;
    }
  };
}
