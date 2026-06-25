import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySensible from "@fastify/sensible";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs/promises";
import { envSchema } from "#schemas/env.schema";
import bookRoutes from "#routes/book.routes";
import { getModelHash } from "#migrations/migrate";

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

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/"
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

  const versionPath = path.join(process.cwd(), "data", "version.json");
  try {
    const verContent = await fs.readFile(versionPath, "utf8");
    const savedHash = JSON.parse(verContent).hash;
    if (savedHash !== getModelHash()) {
      fastify.log.warn(
        'Data schema changed. Run "npm run migrate" to update existing files.'
      );
    }
  } catch {
    fastify.log.warn(
      'Data schema file not found. Run "npm run migrate" to update existing files.'
    );
  }

  return fastify;
};
