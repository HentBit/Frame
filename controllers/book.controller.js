const bookRepository = require('#repositories/book.repository');
const logger = require('#utils/logger');
const {
  validateBook,
  validatePatchBook,
} = require('#validators/book.validator');

const bookController = {
  getHealth: (req, res) => {
    const healthData = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
    };
    res.statusCode = 200;
    logger('INFO', req.method, req.url, 200);
    res.end(JSON.stringify(healthData));
  },

  getBooks: (req, res, parsedUrl) => {
    const authorParam = parsedUrl.searchParams.get('author');
    let results = bookRepository.getAll();

    if (authorParam) {
      results = results.filter(
        (book) => book.author.toLowerCase() === authorParam.toLowerCase()
      );
    }

    res.statusCode = 200;
    logger('INFO', req.method, req.url, 200);
    res.end(JSON.stringify({ count: results.length, items: results }));
  },

  createBook: (req, res, body) => {
    try {
      const data = JSON.parse(body);
      const isValid = validateBook(data);

      if (!isValid) {
        res.statusCode = 400;
        logger('WARN', req.method, req.url, 400, 'Validation failed');
        return res.end(
          JSON.stringify({
            error: 'Некоректні дані',
            details: validateBook.errors,
          })
        );
      }

      const newBook = bookRepository.create(data);
      res.statusCode = 201;
      logger('INFO', req.method, req.url, 201);
      res.end(JSON.stringify({ message: 'Created', book: newBook }));
    } catch {
      res.statusCode = 400;
      logger('ERROR', req.method, req.url, 400, 'Invalid JSON');
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  },

  patchBook: (req, res, id, body) => {
    try {
      const book = bookRepository.getById(id);
      if (!book) {
        res.statusCode = 404;
        logger('WARN', req.method, req.url, 404, 'Book not found');
        return res.end(JSON.stringify({ error: 'Not Found' }));
      }

      const updates = JSON.parse(body);
      if (updates.id !== undefined) {
        res.statusCode = 400;
        logger('WARN', req.method, req.url, 400, 'Attempt to change ID');
        return res.end(JSON.stringify({ error: 'Changing ID is forbidden' }));
      }

      const isValid = validatePatchBook(updates);
      if (!isValid) {
        res.statusCode = 400;
        logger('WARN', req.method, req.url, 400, 'Patch validation failed');
        return res.end(
          JSON.stringify({
            error: 'Некоректні дані для оновлення',
            details: validatePatchBook.errors,
          })
        );
      }

      const updatedBook = bookRepository.update(id, updates);
      res.statusCode = 200;
      logger('INFO', req.method, req.url, 200);
      res.end(JSON.stringify({ message: 'Updated', book: updatedBook }));
    } catch {
      res.statusCode = 400;
      logger('ERROR', req.method, req.url, 400, 'Patch error');
      res.end(JSON.stringify({ error: 'Error' }));
    }
  },

  deleteBook: (req, res, id) => {
    const isDeleted = bookRepository.delete(id);
    if (isDeleted) {
      res.statusCode = 200;
      logger('INFO', req.method, req.url, 200);
      res.end(JSON.stringify({ message: 'Deleted' }));
    } else {
      res.statusCode = 404;
      logger('WARN', req.method, req.url, 404, 'Book not found for deletion');
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  },
};

module.exports = bookController;
