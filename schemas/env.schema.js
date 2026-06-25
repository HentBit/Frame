export const envSchema = {
  type: "object",
  required: ["REDIS_HOST", "REDIS_PORT", "JWT_SECRET"],
  properties: {
    REDIS_HOST: { type: "string", default: "127.0.0.1" },
    REDIS_PORT: { type: "number", default: 6379 },
    JWT_SECRET: { type: "string" }
  }
};
