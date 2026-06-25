export const bookCoreProperties = {
  title: { type: "string", minLength: 1 },
  author: { type: "string", minLength: 1 },
  year: { type: "integer", minimum: 1000, maximum: new Date().getFullYear() },
  genre: { type: "string", minLength: 1 }
};

export const bookResponseProperties = {
  id: { type: "integer" },
  ...bookCoreProperties,
  image: { type: ["string", "null"] }
};

export const createBookSchema = {
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
  querystring: { type: "object", properties: { author: { type: "string" } } },
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
