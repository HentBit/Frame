import { Transform } from "stream";

export class BookAgeTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(book, encoding, callback) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - book.year;

    const transformedBook = {
      ...book,
      age: age >= 0 ? age : 0
    };

    callback(null, transformedBook);
  }
}
