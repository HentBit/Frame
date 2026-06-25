export const REDIS_KEYS = {
  REFERENCE_CACHE: "cache:reference",
  ITEMS_PREFIX: "cache:items:",
  BLACKLIST_PREFIX: "blacklist:",
  REFRESH_PREFIX: "refresh:"
};

export const getItemsCacheKey = (page, limit) =>
  `${REDIS_KEYS.ITEMS_PREFIX}page:${page}:limit:${limit}`;
