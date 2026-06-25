import argon2 from "argon2";
import { users } from "../models/user.model.js"; // або звідки у тебе імпортується схема юзерів
import { eq } from "drizzle-orm";

export default async function authRoutes(fastify) {
  fastify.post("/auth/register", async (request, reply) => {
    const { email, password } = request.body;

    const [existingUser] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser) {
      return reply.code(400).send({ error: "Email already registered" });
    }

    const hashedPassword = await argon2.hash(password);
    await fastify.db.insert(users).values({ email, password: hashedPassword });

    return reply.code(201).send();
  });

  fastify.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body;

    const [user] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!user || !(await argon2.verify(user.password, password))) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    request.session.userId = user.id;
    return reply.code(200).send({ success: true });
  });

  fastify.post("/auth/logout", async (request, reply) => {
    if (!request.session.userId) {
      return reply.code(204).send();
    }
    await request.session.destroy();
    return reply.code(204).send();
  });
}
