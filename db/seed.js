import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { books } from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const force = process.argv.includes("--force");
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
  });

  const db = drizzle(connection);

  if (force) {
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0;");
    await connection.execute("TRUNCATE TABLE books;");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1;");
    console.log("Database cleared via Drizzle.");
  }

  await db.insert(books).values([
    { title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937, genre: "Fantasy" },
    { title: "1984", author: "George Orwell", year: 1949, genre: "Dystopian" }
  ]);

  console.log("Database seeded via Drizzle.");
  await connection.end();
}

seed().catch(console.error);