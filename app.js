const { createServer } = require('node:http');
const config = require('./config');
const router = require('#routes/book.routes');

let isShuttingDown = false;
let server;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(
    `\n[SHUTDOWN] Отримано сигнал ${signal}. Починаємо Graceful Shutdown...`
  );

  const timeout = setTimeout(() => {
    console.error(
      '[SHUTDOWN] Сервер не встиг закритись за 10с. Завершуємо примусово.'
    );
    process.exit(1);
  }, 10000);

  timeout.unref();

  if (server) {
    server.close((err) => {
      if (err) {
        console.error(
          `[SHUTDOWN] Помилка під час закриття сервера: ${err.message}`
        );
        process.exit(1);
      }
      console.log(
        '[SHUTDOWN] Усі підключення закрито. Сервер успішно зупинено.'
      );
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

server = createServer(router);

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(
    `[START] Сервер працює на http://${config.HOSTNAME}:${config.PORT}/ у режимі [${config.NODE_ENV}]`
  );
});

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

process.on('uncaughtException', (err) => {
  console.error(`[CRITICAL] Uncaught Exception: ${err.message}\n${err.stack}`);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(`[CRITICAL] Unhandled Rejection. Причина: ${reason}`);
  gracefulShutdown('unhandledRejection');
});
