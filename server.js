import { buildApp } from "./app.js";
import { runBackup } from "#utils/fs.utils";

const start = async () => {
  const fastify = await buildApp();

  const gracefulShutdown = async (signal) => {
    fastify.log.error(`[SHUTDOWN] Отримано сигнал ${signal}.`);
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    await fastify.close();
    process.exit(0);
  };

  fastify.addHook("onClose", async (instance) => {
    instance.log.error(
      "[SHUTDOWN] Всі ресурси та підключення Fastify успішно закрито."
    );
  });

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  try {
    await runBackup(fastify.log);
    await fastify.listen({
      port: fastify.config.PORT,
      host: fastify.config.HOSTNAME
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
