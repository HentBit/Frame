import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import fastifyWebsocket from "@fastify/websocket";
import path from "path";
import { envSchema } from "#schemas/env.schema";
import bookRoutes from "./routes/book.routes.js";
import mongoPlugin from "./db/mongo.js";
import BookRepositoryPlugin from "./repositories/book.repository.js";

export const buildApp = async (opts = {}) => {
  const fastify = Fastify(opts);

  await fastify.register(fastifyEnv, {
    dotenv: true,
    schema: envSchema
  });

  await fastify.after();

  await fastify.register(fastifySensible);

  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

  await fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "uploads"),
    prefix: "/uploads/"
  });

  await fastify.register(fastifyWebsocket);

  await fastify.register(mongoPlugin);

  await fastify.register(BookRepositoryPlugin);

  await fastify.register(bookRoutes);

  return fastify;
};
