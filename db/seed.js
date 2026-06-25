/* eslint-disable no-process-env */
/* eslint-disable no-unused-vars */
import { BookModel } from "./models/book.model.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const initialBooks = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    year: 1937,
    genre: "Fantasy"
  },
  { title: "1984", author: "George Orwell", year: 1949, genre: "Dystopian" }
];

async function seed() {
  const force = process.argv.includes("--force");
  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.MONGO_DB_NAME
  });

  // Використовуємо mongoose.connection.db напряму, щоб уникнути конфліктів моделей між гілками лаби
  const collection = mongoose.connection.db.collection("books");

  if (force) {
    await collection.deleteMany({});
    console.log("Database cleared forces.");
  }

  const count = await collection.countDocuments({});
  if (count === 0 || force) {
    await collection.insertMany(initialBooks);
    console.log("Database seeded successfully!");
  } else {
    console.log("Database already has data. Skipping seed.");
  }

  await mongoose.connection.close();
}

seed().catch(console.error);
