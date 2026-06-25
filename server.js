import { buildApp } from "./app.js";
import { runBackup } from "./utils/fs.utils.js";

const start = async () => {
  let fastify;

  try {
    fastify = await buildApp({ logger: true });

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

    /* eslint-disable no-process-env */
    const port = fastify.config?.PORT || process.env.PORT || 3000;
    const host =
      fastify.config?.HOSTNAME || process.env.HOSTNAME || "127.0.0.1";
    /* eslint-enable no-process-env */

    await runBackup(fastify.log);

    await fastify.listen({
      port: Number(port),
      host: host
    });
  } catch (err) {
    if (fastify?.log) {
      fastify.log.error(err);
    } else {
      console.error("CRITICAL ERROR ON STARTUP:", err);
    }
    process.exit(1);
  }
};

start();
