import fs from "fs/promises";
import path from "path";
import { BookModel } from "#models/book.model";
import { writeAtomic } from "#utils/fs.utils";

const itemsDir = path.join(process.cwd(), "data", "items");

const bookRepository = {
  findAll: async () => {
    try {
      const files = await fs.readdir(itemsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));
      const books = [];

      for (const file of jsonFiles) {
        const content = await fs.readFile(path.join(itemsDir, file), "utf8");
        books.push(JSON.parse(content));
      }
      return books.sort((a, b) => a.id - b.id);
    } catch {
      return [];
    }
  },

  findById: async (id) => {
    try {
      const filePath = path.join(itemsDir, `${id}.json`);
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  },

  create: async (bookData) => {
    const books = await bookRepository.findAll();
    const lastId = books.length > 0 ? books[books.length - 1].id : 0;
    const newId = lastId + 1;

    const newBook = { id: newId };
    for (const key of Object.keys(BookModel)) {
      newBook[key] =
        bookData[key] !== undefined ? bookData[key] : BookModel[key];
    }

    const filePath = path.join(itemsDir, `${newId}.json`);
    await writeAtomic(filePath, newBook);
    return newBook;
  },

  update: async (id, updates) => {
    const book = await bookRepository.findById(id);
    if (!book) return null;

    const updatedBook = { ...book, ...updates };
    const filePath = path.join(itemsDir, `${id}.json`);
    await writeAtomic(filePath, updatedBook);
    return updatedBook;
  },

  delete: async (id) => {
    try {
      const filePath = path.join(itemsDir, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
};

export default bookRepository;
