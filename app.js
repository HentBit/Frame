import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySensible from "@fastify/sensible";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import { envSchema } from "#schemas/env.schema";
import bookRoutes from "#routes/book.routes";

export const buildApp = async () => {
  // eslint-disable-next-line no-process-env
  const isProd = process.env.NODE_ENV === "production";

  const fastify = Fastify({
    logger: {
      level: isProd ? "error" : "info",
      transport: !isProd ? { target: "pino-pretty" } : undefined
    }
  });

  await fastify.register(fastifyEnv, { schema: envSchema, dotenv: true });
  await fastify.register(fastifyHelmet, { global: true });

  await fastify.register(fastifyCors, {
    origin:
      fastify.config.NODE_ENV === "production" ? "https://example.com" : "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  });

  await fastify.register(fastifySensible);

  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error });
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message: error.message
    });
  });

  await fastify.register(bookRoutes);

  return fastify;
};
