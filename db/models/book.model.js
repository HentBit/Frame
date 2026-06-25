import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  image: { type: String, default: null },
  schemaVersion: { type: Number, default: 2 }
});

export const BookModel = mongoose.model("Book", bookSchema);
