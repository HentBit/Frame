import { BookModel } from "../db/models/book.model.js";

class BookRepository {
  constructor(db) {
    this.db = db; // Передаємо з'єднання через Dependency Injection
  }

  _mapId(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: _id.toString(), ...rest };
  }

  async findAll() {
    const docs = await BookModel.find({}).lean();
    return docs.map(this._mapId);
  }

  async findById(id) {
    try {
      const doc = await BookModel.findById(id).lean();
      return this._mapId(doc);
    } catch {
      return null;
    }
  }

  async create(data) {
    const doc = await BookModel.create(data);
    return this._mapId(doc.toObject());
  }

  async update(id, data) {
    try {
      const doc = await BookModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      ).lean();
      return this._mapId(doc);
    } catch {
      return null;
    }
  }

  async delete(id) {
    try {
      const result = await BookModel.findByIdAndDelete(id);
      return !!result;
    } catch {
      return false;
    }
  }

  async count() {
    return BookModel.countDocuments({});
  }

  async clear() {
    await BookModel.deleteMany({});
  }
}

export default BookRepository;