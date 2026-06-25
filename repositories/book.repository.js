import { eq } from "drizzle-orm";
import { books } from "../db/schema.js";

class BookRepository {
  constructor(drizzleDb) {
    this.db = drizzleDb;
  }

  async findAll() {
    return this.db.select().from(books);
  }

  async findById(id) {
    const result = await this.db.select().from(books).where(eq(books.id, id));
    return result.length ? result[0] : null;
  }

  async create(data) {
    const [result] = await this.db.insert(books).values(data);
    return { id: result.insertId, ...data };
  }

  async update(id, data) {
    await this.db.update(books).set(data).where(eq(books.id, id));
    return this.findById(id);
  }

  async delete(id) {
    const result = await this.db.delete(books).where(eq(books.id, id));
    return result.affectedRows > 0;
  }
}

export default BookRepository;