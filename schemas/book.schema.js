export const bookCoreProperties = {
  title: { type: "string", minLength: 1, description: "Назва книги" },
  author: { type: "string", minLength: 1, description: "Автор книги" },
  year: {
    type: "integer",
    minimum: 1000,
    maximum: new Date().getFullYear(),
    description: "Рік видання"
  },
  genre: { type: "string", minLength: 1, description: "Жанр книги" }
};

export const bookResponseProperties = {
  id: { type: "integer", description: "Унікальний ID книги" },
  ...bookCoreProperties,
  image: {
    type: ["string", "null"],
    description: "Посилання на обкладинку книги"
  }
};

export const createBookSchema = {
  description: "Створити нову книгу",
  tags: ["Books V1"],
  body: {
    type: "object",
    required: ["title", "author", "year", "genre"],
    properties: bookCoreProperties,
    additionalProperties: false
  },
  response: {
    201: {
      type: "object",
      properties: {
        message: { type: "string" },
        book: { type: "object", properties: bookResponseProperties }
      }
    }
  }
};

export const updateBookSchema = {
  description: "Частково оновити дані книги",
  tags: ["Books V1"],
  params: { type: "object", properties: { id: { type: "integer" } } },
  body: {
    type: "object",
    properties: bookCoreProperties,
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {
        message: { type: "string" },
        book: { type: "object", properties: bookResponseProperties }
      }
    }
  }
};

export const getBooksSchema = {
  description: "Отримати повний список книг без пагінації",
  tags: ["Books V1"],
  querystring: {
    type: "object",
    properties: { author: { type: "string", description: "Фільтр за автором" } }
  },
  response: {
    200: {
      type: "object",
      properties: {
        count: { type: "integer" },
        items: {
          type: "array",
          items: { type: "object", properties: bookResponseProperties }
        }
      }
    }
  }
};

export const getBooksV2Schema = {
  description: "Отримати список книг з підтримкою пагінації",
  tags: ["Books V2"],
  querystring: {
    type: "object",
    properties: {
      page: {
        type: "integer",
        default: 1,
        minimum: 1,
        description: "Номер сторінки"
      },
      limit: {
        type: "integer",
        default: 10,
        minimum: 1,
        description: "Кількість елементів на сторінку"
      }
    }
  },
  response: {
    200: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { type: "object", properties: bookResponseProperties }
        },
        meta: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" }
          }
        }
      }
    }
  }
};

export const getBookDetailsSchema = {
  description:
    "Отримати деталі книги, інтегровані з інформацією про жанр із зовнішнього сервера",
  tags: ["Books V1"],
  params: { type: "object", properties: { id: { type: "integer" } } },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "integer" },
        title: { type: "string" },
        author: { type: "string" },
        year: { type: "integer" },
        genre: { type: "string" },
        image: { type: ["string", "null"] },
        genreDetails: {
          type: ["object", "null"],
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            ageRating: { type: "integer" }
          }
        }
      }
    }
  }
};
