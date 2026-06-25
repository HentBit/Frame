import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { stringify } from "csv-stringify/sync";
import { parse } from "csv-parse/sync";
import Ajv from "ajv";
import bookRepository from "#repositories/book.repository";
import { bookCoreProperties } from "#schemas/book.schema";
import { buildImageUrl } from "#utils/url.utils";
import { MESSAGES } from "#constants/messages";

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });
const validateImportItem = ajv.compile({
  type: "object",
  required: ["title", "author", "year", "genre"],
  properties: bookCoreProperties
});

const cachePath = path.join(process.cwd(), "data", "cache", "reference.json");
const CACHE_TTL_MS = 120 * 1000;

const fetchGenreWithRetryAndTimeout = async (genreName) => {
  try {
    const cacheContent = await fs.readFile(cachePath, "utf8");
    const cacheData = JSON.parse(cacheContent);
    if (
      Date.now() - cacheData.timestamp < CACHE_TTL_MS &&
      cacheData.data[genreName]
    ) {
      return cacheData.data[genreName];
    }
  } catch {
    /* ігноруємо відсутність або пошкодження файлу кешу */
  }

  const url = `http://127.0.0.1:3001/genres`;
  const retries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const genres = await response.json();
      const matchedGenre =
        genres.find((g) => g.name.toLowerCase() === genreName.toLowerCase()) ||
        null;

      try {
        await fs.mkdir(path.dirname(cachePath), { recursive: true });
        let existingCache = { timestamp: Date.now(), data: {} };
        try {
          const raw = await fs.readFile(cachePath, "utf8");
          existingCache = JSON.parse(raw);
        } catch {
          /* ігноруємо помилку читання старого файлу кешу */
        }

        existingCache.timestamp = Date.now();
        if (matchedGenre) {
          existingCache.data[genreName] = matchedGenre;
        }
        await fs.writeFile(
          cachePath,
          JSON.stringify(existingCache, null, 2),
          "utf8"
        );
      } catch {
        /* ігноруємо невдалий запис кешу на диск */
      }

      return matchedGenre;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries - 1) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    `[FETCH ERROR] Сервіс жанрів недоступний після спроб: ${lastError?.message}`
  );
  return null;
};

const bookController = {
  getHealth: async (request, reply) => reply.send({ status: "ok" }),

  getHealthDetails: async (request, reply) =>
    reply.send({
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage()
    }),

  getBooks: async (request, reply) => {
    const { author } = request.query;
    let books = await bookRepository.findAll();

    if (author) {
      books = books.filter(
        (b) => b.author.toLowerCase() === author.toLowerCase()
      );
    }

    const items = books.map((b) => ({
      ...b,
      image: buildImageUrl(request, b.image)
    }));
    return reply.send({ count: items.length, items });
  },

  getBooksV2: async (request, reply) => {
    const page = parseInt(request.query.page || 1, 10);
    const limit = parseInt(request.query.limit || 10, 10);

    const allBooks = await bookRepository.findAll();
    const total = allBooks.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const paginatedBooks = allBooks.slice(startIndex, startIndex + limit);

    const data = paginatedBooks.map((b) => ({
      ...b,
      image: buildImageUrl(request, b.image)
    }));

    return reply.send({
      data,
      meta: { total, page, limit, totalPages }
    });
  },

  getBookDetails: async (request, reply) => {
    const { id } = request.params;
    const book = await bookRepository.findById(id);
    if (!book) throw reply.notFound(MESSAGES.NOT_FOUND);

    const genreDetails = await fetchGenreWithRetryAndTimeout(book.genre);

    return reply.send({
      ...book,
      image: buildImageUrl(request, book.image),
      genreDetails
    });
  },

  createBook: async (request, reply) => {
    const book = await bookRepository.create(request.body);
    return reply.status(201).send({
      message: "Created",
      book: { ...book, image: buildImageUrl(request, book.image) }
    });
  },

  patchBook: async (request, reply) => {
    const { id } = request.params;
    if (request.body.id !== undefined)
      throw reply.badRequest(MESSAGES.FORBIDDEN_ID);

    const book = await bookRepository.update(id, request.body);
    if (!book) throw reply.notFound(MESSAGES.NOT_FOUND);

    return reply.send({
      message: "Updated",
      book: { ...book, image: buildImageUrl(request, book.image) }
    });
  },

  deleteBook: async (request, reply) => {
    const isDeleted = await bookRepository.delete(request.params.id);
    if (!isDeleted) throw reply.notFound(MESSAGES.NOT_FOUND);
    return reply.send({ message: "Deleted" });
  },

  exportCSV: async (request, reply) => {
    const books = await bookRepository.findAll();
    const mapped = books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      year: b.year,
      genre: b.genre,
      image: b.image ? buildImageUrl(request, b.image) : ""
    }));

    const csvData = stringify(mapped, { header: true });
    return reply
      .header("Content-Disposition", 'attachment; filename="books.csv"')
      .type("text/csv")
      .send(csvData);
  },

  importData: async (request, reply) => {
    const data = await request.file();
    const buffer = await data.toBuffer();
    let rawItems = [];

    if (
      data.mimetype === "application/json" ||
      data.filename.endsWith(".json")
    ) {
      rawItems = JSON.parse(buffer.toString());
    } else if (data.mimetype === "text/csv" || data.filename.endsWith(".csv")) {
      rawItems = parse(buffer, { columns: true, skip_empty_lines: true });
    } else {
      throw reply.badRequest("Unsupported file format");
    }

    let imported = 0;
    const rejected = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const valid = validateImportItem(item);

      if (!valid) {
        rejected.push({
          row: i + 1,
          reason: ajv.errorsText(validateImportItem.errors)
        });
      } else {
        await bookRepository.create(item);
        imported++;
      }
    }

    return reply.send({ imported, rejectedCount: rejected.length, rejected });
  },

  uploadImage: async (request, reply) => {
    const { id } = request.params;
    const book = await bookRepository.findById(id);
    if (!book) throw reply.notFound(MESSAGES.NOT_FOUND);

    const data = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } });
    if (!data) throw reply.badRequest("No file uploaded");
    if (!["image/jpeg", "image/png"].includes(data.mimetype)) {
      throw reply.badRequest("Only JPEG and PNG images are allowed");
    }

    const uploadsDir = path.join(process.cwd(), "uploads", id.toString());
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = data.mimetype === "image/png" ? ".png" : ".jpg";
    const filename = `image${ext}`;
    const targetPath = path.join(uploadsDir, filename);

    await pipeline(data.file, createWriteStream(targetPath));

    const relativePath = `/uploads/${id}/${filename}`;
    await bookRepository.update(id, { image: relativePath });

    return reply.send({
      message: "Image uploaded successfully",
      url: buildImageUrl(request, relativePath)
    });
  },

  getSharedReposV1: async (request, reply) => {
    const { repo } = request.query;
    if (!repo)
      throw reply.badRequest("Параметр ?repo=owner/name є обов'язковим");

    const contributorsRes = await fetch(
      `https://api.github.com/repos/${repo}/contributors?per_page=30`
    );
    if (!contributorsRes.ok)
      throw reply.badRequest(
        `Не вдалося отримати дані репозиторію: ${contributorsRes.status}`
      );

    const contributors = await contributorsRes.json();
    const usernames = contributors.map((c) => c.login);

    const repoScores = {};

    for (const username of usernames) {
      try {
        const userReposRes = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=10`
        );
        if (userReposRes.ok) {
          const userRepos = await userReposRes.json();
          for (const uRepo of userRepos) {
            if (uRepo.full_name.toLowerCase() !== repo.toLowerCase()) {
              repoScores[uRepo.full_name] =
                (repoScores[uRepo.full_name] || 0) + 1;
            }
          }
        }
      } catch {
        /* ігноруємо помилки індивідуальних користувачів */
      }
    }

    const topRepos = Object.entries(repoScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        repository: name,
        sharedContributors: count
      }));

    return reply.send({
      version: "v1-rest-sequential",
      targetRepo: repo,
      topSharedRepositories: topRepos
    });
  },

  getSharedReposV2: async (request, reply) => {
    const { repo } = request.query;
    if (!repo)
      throw reply.badRequest("Параметр ?repo=owner/name є обов'язковим");

    const contributorsRes = await fetch(
      `https://api.github.com/repos/${repo}/contributors?per_page=30`
    );
    if (!contributorsRes.ok)
      throw reply.badRequest(
        `Не вдалося отримати дані репозиторію: ${contributorsRes.status}`
      );

    const contributors = await contributorsRes.json();
    const usernames = contributors.map((c) => c.login);

    const repoScores = {};

    await Promise.all(
      usernames.map(async (username) => {
        try {
          const userReposRes = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=20`
          );
          if (userReposRes.ok) {
            const userRepos = await userReposRes.json();
            for (const uRepo of userRepos) {
              if (uRepo.full_name.toLowerCase() !== repo.toLowerCase()) {
                repoScores[uRepo.full_name] =
                  (repoScores[uRepo.full_name] || 0) + 1;
              }
            }
          }
        } catch {
          /* ігноруємо індивідуальні помилки з мережею у паралельних потоках */
        }
      })
    );

    const topRepos = Object.entries(repoScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        repository: name,
        sharedContributors: count
      }));

    return reply.send({
      version: "v2-rest-parallel",
      targetRepo: repo,
      topSharedRepositories: topRepos
    });
  }
};

export default bookController;
