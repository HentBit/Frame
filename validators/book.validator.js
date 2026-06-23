const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });

const bookSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1 },
    author: { type: "string", minLength: 1 },
    year: { type: "integer", minimum: 1000, maximum: new Date().getFullYear() }
  },
  required: ["title", "author", "year"],
  additionalProperties: false
};

const patchBookSchema = {
  ...bookSchema,
  required: []
};

const validateBook = ajv.compile(bookSchema);
const validatePatchBook = ajv.compile(patchBookSchema);

module.exports = { validateBook, validatePatchBook };
