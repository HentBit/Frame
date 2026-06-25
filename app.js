import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySensible from "@fastify/sensible";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import path from "path";
import fs from "fs/promises";
import { envSchema } from "#schemas/env.schema";
import bookRoutesv1 from "#routes/book.routes.v1";
import bookRoutesv2 from "#routes/book.routes.v2";
import { getModelHash } from "#migrations/migrate";

export const buildApp = async () => {
  const fastify = Fastify({
    logger: {
      // eslint-disable-next-line no-process-env
      level: process.env.NODE_ENV === "production" ? "error" : "info",
      transport:
        // eslint-disable-next-line no-process-env
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty" }
          : undefined
    }
  });

  await fastify.register(fastifyEnv, { schema: envSchema, dotenv: true });

  await fastify.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: false
  });
  await fastify.register(fastifyCors, {
    origin:
      fastify.config.NODE_ENV === "production" ? "https://example.com" : "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  });

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: `Ліміт запитів вичерпано. Спробуйте знову через ${context.after}`
    })
  });

  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Books REST API",
        description: "Лабораторна робота №6",
        version: "1.0.0"
      },
      servers: [{ url: "http://127.0.0.1:3000" }]
    }
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false }
  });

  await fastify.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }
  });
  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/"
  });

  await fastify.register(fastifySensible);

  await fastify.register(bookRoutesv1, { prefix: "/api/v1" });
  await fastify.register(bookRoutesv2, { prefix: "/api/v2" });

  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error });
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      statusCode,
      error: error.name,
      message: error.message
    });
  });

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
