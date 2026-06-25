import { mysqlTable, int, varchar } from "drizzle-orm/mysql-core";

export const books = mysqlTable("books", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  year: int("year").notNull(),
  genre: varchar("genre", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  schemaVersion: int("schemaVersion").default(2)
});
