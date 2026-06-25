import argon2 from "argon2";
import { randomUUID } from "crypto";
import { users } from "../models/user.model.js";
import { eq } from "drizzle-orm";
import { REDIS_KEYS } from "../utils/redis-keys.js";

export default async function authJwtRoutes(fastify) {
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

    const jti = randomUUID();
    const accessToken = await reply.jwtSign(
      { sub: user.id, jti },
      { expiresIn: "15m" }
    );
    const refreshToken = await reply.jwtSign(
      { sub: user.id },
      { expiresIn: "7d" }
    );

    await fastify.redis.set(
      `${REDIS_KEYS.REFRESH_PREFIX}${user.id}`,
      refreshToken,
      "EX",
      604800
    );

    return reply
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: fastify.config.NODE_ENV === "production",
        sameSite: "strict",
        path: "/auth/refresh"
      })
      .send({ accessToken });
  });

  fastify.post("/auth/refresh", async (request, reply) => {
    const tokenFromCookie = request.cookies.refreshToken;
    if (!tokenFromCookie)
      return reply.code(401).send({ error: "Refresh token missing" });

    try {
      const decoded = fastify.jwt.verify(tokenFromCookie);
      const savedRefresh = await fastify.redis.get(
        `${REDIS_KEYS.REFRESH_PREFIX}${decoded.sub}`
      );

      if (!savedRefresh || savedRefresh !== tokenFromCookie) {
        return reply.code(401).send({ error: "Invalid refresh token" });
      }

      const newJti = randomUUID();
      const accessToken = await reply.jwtSign(
        { sub: decoded.sub, jti: newJti },
        { expiresIn: "15m" }
      );
      return { accessToken };
    } catch {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }
  });

  fastify.post(
    "/auth/logout",
    { onRequest: [fastify.authenticateJwt] },
    async (request, reply) => {
      const { jti, exp, sub } = request.user;
      const currentTime = Math.floor(Date.now() / 1000);

      if (jti && exp > currentTime) {
        const ttl = exp - currentTime;
        await fastify.redis.set(
          `${REDIS_KEYS.BLACKLIST_PREFIX}${jti}`,
          "1",
          "EX",
          ttl
        );
      }

      await fastify.redis.del(`${REDIS_KEYS.REFRESH_PREFIX}${sub}`);

      return reply
        .clearCookie("refreshToken", { path: "/auth/refresh" })
        .code(204)
        .send();
    }
  );
}
