import { BOOKS } from "#data/books.data";

const bookRepository = {
  getAll: () => BOOKS,
  getById: (id) => BOOKS.find((b) => b.id === id),
  create: (bookData) => {
    const lastId = BOOKS.length > 0 ? BOOKS[BOOKS.length - 1].id : 0;
    const newBook = { id: lastId + 1, ...bookData };
    BOOKS.push(newBook);
    return newBook;
  },
  update: (id, updates) => {
    const index = BOOKS.findIndex((b) => b.id === id);
    if (index === -1) return null;
    BOOKS[index] = { ...BOOKS[index], ...updates };
    return BOOKS[index];
  },
  delete: (id) => {
    const index = BOOKS.findIndex((b) => b.id === id);
    if (index === -1) return false;
    BOOKS.splice(index, 1);
    return true;
  }
};

export default bookRepository;
