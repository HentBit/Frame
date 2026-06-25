import fp from "fastify-plugin";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema.js";

async function drizzlePlugin(fastify) {
  if (!fastify.mysql) {
    throw new Error("MySQL pool is not registered. Register mysql plugin before drizzle.");
  }

  const db = drizzle(fastify.mysql, { schema, mode: "default" });
  fastify.decorate("drizzle", db);
}

export default fp(drizzlePlugin, {
  name: "drizzle-plugin",
  dependencies: ["mysql-plugin"]
});