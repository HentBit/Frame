const { createServer } = require("node:http");
const config = require("./config"); 


let BOOKS = [
  { id: 1, title: "Kobzar", author: "Shevchenko", year: 1840 }
];


function logger(level, method, url, status, message = "") {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const formattedDate = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  const extraMessage = message ? ` | Msg: ${message}` : "";
  
  const logLine = `[${formattedDate}] [${level}] - - > ${method} ${url} | Status: ${status}${extraMessage}`;

  if (config.NODE_ENV === "production") {
    if (status >= 400) {
      process.stderr.write(logLine + "\n");
    }
  } else {
    if (status >= 400) {
      process.stderr.write(logLine + "\n"); 
    } else {
      process.stdout.write(logLine + "\n"); 
    }
  }
}

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (method === "GET" && pathname === "/health") {
    const healthData = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage()
    };
    res.statusCode = 200;
    logger("INFO", method, req.url, 200);
    return res.end(JSON.stringify(healthData));
  }

  if (method === "GET" && pathname === "/books") {
    const authorParam = parsedUrl.searchParams.get("author");
    let results = [...BOOKS];

    if (authorParam) {
      results = results.filter(
        (book) => book.author.toLowerCase() === authorParam.toLowerCase()
      );
    }

    res.statusCode = 200;
    logger("INFO", method, req.url, 200);
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  if (method === "POST" && pathname === "/books") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.title || typeof data.title !== "string" ||
            !data.author || typeof data.author !== "string" ||
            !data.year || typeof data.year !== "number") {
          res.statusCode = 400;
          logger("WARN", method, req.url, 400, "Validation failed");
          return res.end(JSON.stringify({ error: "Некоректні дані" }));
        }

        const lastId = BOOKS.length > 0 ? BOOKS[BOOKS.length - 1].id : 0;
        const newBook = { id: lastId + 1, title: data.title, author: data.author, year: data.year };
        BOOKS.push(newBook);

        res.statusCode = 201;
        logger("INFO", method, req.url, 201);
        return res.end(JSON.stringify({ message: "Created", book: newBook }));
      } catch (err) {
        res.statusCode = 400;
        logger("ERROR", method, req.url, 400, "Invalid JSON");
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  if (method === "PATCH" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);
    if (isNaN(id)) {
      res.statusCode = 400;
      logger("WARN", method, req.url, 400, "Invalid ID");
      return res.end(JSON.stringify({ error: "Invalid ID" }));
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      try {
        const index = BOOKS.findIndex(b => b.id === id);
        if (index === -1) {
          res.statusCode = 404;
          logger("WARN", method, req.url, 404, "Book not found");
          return res.end(JSON.stringify({ error: "Not Found" }));
        }

        const updates = JSON.parse(body);
        if (updates.id !== undefined) {
          res.statusCode = 400;
          logger("WARN", method, req.url, 400, "Attempt to change ID");
          return res.end(JSON.stringify({ error: "Changing ID is forbidden" }));
        }

        BOOKS[index] = { ...BOOKS[index], ...updates };
        res.statusCode = 200;
        logger("INFO", method, req.url, 200);
        return res.end(JSON.stringify({ message: "Updated", book: BOOKS[index] }));
      } catch (e) {
        res.statusCode = 400;
        logger("ERROR", method, req.url, 400, "Patch error");
        return res.end(JSON.stringify({ error: "Error" }));
      }
    });
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);
    const originalLength = BOOKS.length;
    BOOKS = BOOKS.filter(b => b.id !== id);

    if (BOOKS.length < originalLength) {
      res.statusCode = 200;
      logger("INFO", method, req.url, 200);
      return res.end(JSON.stringify({ message: "Deleted" }));
    } else {
      res.statusCode = 404;
      logger("WARN", method, req.url, 404, "Book not found for deletion");
      return res.end(JSON.stringify({ error: "Not Found" }));
    }
  }

  res.statusCode = 404;
  logger("WARN", method, req.url, 404, "Route not found");
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`[START] Сервер працює на http://${config.HOSTNAME}:${config.PORT}/ у режимі [${config.NODE_ENV}]`);
});

let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[SHUTDOWN] Отримано сигнал ${signal}. Починаємо Graceful Shutdown...`);

  const timeout = setTimeout(() => {
    console.error("[SHUTDOWN] Сервер не встиг закритись за 10с. Завершуємо примусово.");
    process.exit(1);
  }, 10000);

  timeout.unref();

  server.close((err) => {
    if (err) {
      console.error(`[SHUTDOWN] Помилка під час закриття сервера: ${err.message}`);
      process.exit(1);
    }
    console.log("[SHUTDOWN] Усі підключення закрито. Сервер успішно зупинено.");
    process.exit(0);
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  console.error(`[CRITICAL] Uncaught Exception: ${err.message}\n${err.stack}`);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`[CRITICAL] Unhandled Rejection на промісі:`, promise, `Причина:`, reason);
  gracefulShutdown("unhandledRejection");
});