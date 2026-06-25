import Fastify from "fastify";
import fastifyEnv from "@fastify/env";
import fastifySensible from "@fastify/sensible";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import fastifyWebsocket from "@fastify/websocket";
import fastifyRedis from "@fastify/redis";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import RedisStore from "fastify-session-redis-store";
import path from "path";
import { envSchema } from "#schemas/env.schema";
import bookRoutes from "./routes/book.routes.js";
import bookRoutesV1 from "./routes/book.routes.v1.js";
import bookRoutesV2 from "./routes/book.routes.v2.js";
import authRoutes from "./routes/auth.routes.js";
import mongoPlugin from "./db/mongo.js";
import BookRepositoryPlugin from "./repositories/book.repository.js";
import { createReferenceService } from "./utils/reference.utils.js";
import { createBookCacheService } from "./utils/book-cache.utils.js";

export const buildApp = async (opts = {}) => {
  const fastify = Fastify(opts);

  await fastify.register(fastifyEnv, {
    dotenv: true,
    schema: envSchema
  });

  await fastify.after();

  await fastify.register(fastifyRedis, {
    host: fastify.config.REDIS_HOST,
    port: fastify.config.REDIS_PORT,
    closeClient: true
  });

  await fastify.after();

  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: fastify.redis
  });

  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    secret: fastify.config.SESSION_SECRET,
    store: new RedisStore({ client: fastify.redis }),
    cookie: {
      httpOnly: true,
      secure: fastify.config.NODE_ENV === "production",
      maxAge: 86400000
    },
    saveUninitialized: false
  });

  fastify.decorate("authenticateSession", async (request, reply) => {
    if (!request.session.userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

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

  const referenceService = createReferenceService({ redis: fastify.redis });
  fastify.decorate("referenceService", referenceService);

  const bookCacheService = createBookCacheService({
    db: fastify.db,
    redis: fastify.redis,
    bookRepository: fastify.bookRepository
  });
  fastify.decorate("bookCacheService", bookCacheService);

  await fastify.register(bookRoutes);
  await fastify.register(bookRoutesV1);
  await fastify.register(bookRoutesV2);
  await fastify.register(authRoutes);

  return fastify;
};
