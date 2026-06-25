import bookController from "#controllers/book.controller";
import { getBooksV2Schema } from "#schemas/book.schema";

export default async function bookRoutesV2(fastify) {
  fastify.get(
    "/books",
    { schema: getBooksV2Schema },
    bookController.getBooksV2
  );
}
