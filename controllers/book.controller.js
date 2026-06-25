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

    const data = await request.file({
      limits: { fileSize: 5 * 1024 * 1024 }
    });

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
  }
};

export default bookController;
