const bookController = require('#controllers/book.controller');
const logger = require('#utils/logger');

function router(req, res) {
  const method = req.method;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (method === 'GET' && pathname === '/health') {
    return bookController.getHealth(req, res);
  }

  if (method === 'GET' && pathname === '/books') {
    return bookController.getBooks(req, res, parsedUrl);
  }

  if (method === 'POST' && pathname === '/books') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => bookController.createBook(req, res, body));
    return;
  }

  if (method === 'PATCH' && pathname.startsWith('/books/')) {
    const id = parseInt(pathname.split('/')[2]);
    if (isNaN(id)) {
      res.statusCode = 400;
      logger('WARN', method, req.url, 400, 'Invalid ID');
      return res.end(JSON.stringify({ error: 'Invalid ID' }));
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => bookController.patchBook(req, res, id, body));
    return;
  }

  if (method === 'DELETE' && pathname.startsWith('/books/')) {
    const id = parseInt(pathname.split('/')[2]);
    if (isNaN(id)) {
      res.statusCode = 400;
      logger('WARN', method, req.url, 400, 'Invalid ID');
      return res.end(JSON.stringify({ error: 'Invalid ID' }));
    }
    return bookController.deleteBook(req, res, id);
  }

  res.statusCode = 404;
  logger('WARN', method, req.url, 404, 'Route not found');
  res.end(JSON.stringify({ error: 'Route not found' }));
}

module.exports = router;
