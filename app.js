const { createServer } = require("node:http");

let BOOKS = [
  { id: 1, title: "Kobzar", author: "Shevchenko", year: 1840 }
];

const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1";

const server = createServer((req, res) => {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (method === "GET" && pathname === "/books") {
    const authorParam = parsedUrl.searchParams.get("author");
    let results = [...BOOKS];

    if (authorParam) {
      results = results.filter(
        (book) => book.author.toLowerCase() === authorParam.toLowerCase()
      );
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ count: results.length, items: results }));
  }

  if (method === "POST" && pathname === "/books") {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.title || typeof data.title !== "string" || data.title.trim() === "" ||
            !data.author || typeof data.author !== "string" || data.author.trim() === "" ||
            !data.year || typeof data.year !== "number" || data.year <= 0) {
          
          res.statusCode = 400;
          return res.end(JSON.stringify({ 
            error: "Валідація провалена. Поля 'title' (string), 'author' (string) та 'year' (number) є обов'язковими." 
          }));
        }

        const lastId = BOOKS.length > 0 ? BOOKS[BOOKS.length - 1].id : 0;
        const newBook = {
          id: lastId + 1,
          title: data.title.trim(),
          author: data.author.trim(),
          year: data.year
        };

        BOOKS.push(newBook);
        res.statusCode = 201;
        return res.end(JSON.stringify({ message: "Книгу успішно додано", book: newBook }));

      } catch (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Некоректний формат JSON" }));
      }
    });
    return;
  }

  if (method === "PATCH" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);
    
    if (isNaN(id)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Некоректний ID книги" }));
    }

    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });

    req.on("end", () => {
      try {
        const index = BOOKS.findIndex((book) => book.id === id);
        if (index === -1) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: "Книгу з таким ID не знайдено" }));
        }

        const updates = JSON.parse(body);

        if (updates.id !== undefined) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Зміна поля 'id' заборонена" }));
        }

        if (updates.title !== undefined && (typeof updates.title !== "string" || updates.title.trim() === "")) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'title' має бути непустим рядком" }));
        }
        if (updates.author !== undefined && (typeof updates.author !== "string" || updates.author.trim() === "")) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'author' має бути непустим рядком" }));
        }
        if (updates.year !== undefined && (typeof updates.year !== "number" || updates.year <= 0)) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Поле 'year' має бути додатним числом" }));
        }

        BOOKS[index] = { ...BOOKS[index], ...updates };
        
        res.statusCode = 200;
        return res.end(JSON.stringify({ message: "Дані книги оновлено", book: BOOKS[index] }));

      } catch (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: "Некоректний формат JSON" }));
      }
    });
    return;
  }

  if (method === "DELETE" && pathname.startsWith("/books/")) {
    const id = parseInt(pathname.split("/")[2]);

    if (isNaN(id)) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Некоректний ID книги" }));
    }

    const originalLength = BOOKS.length;
    BOOKS = BOOKS.filter((book) => book.id !== id);

    if (BOOKS.length < originalLength) {
      res.statusCode = 200;
      return res.end(JSON.stringify({ message: "Книгу успішно видалено" }));
    } else {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Книгу з таким ID не знайдено" }));
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Маршрут не знайдено" }));
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Сервер успішно запущено за адресою http://${HOSTNAME}:${PORT}/`);
});