import fp from "fastify-plugin";
import mongoose from "mongoose";

async function mongoPlugin(fastify) {
  try {
    /* eslint-disable no-process-env */
    const url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
    const dbName = process.env.MONGO_DB_NAME || "book_store";
    /* eslint-enable no-process-env */

    await mongoose.connect(`${url}/${dbName}`);
    fastify.log.info("Successfully connected to MongoDB");
  } catch (error) {
    fastify.log.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

export default fp(mongoPlugin);
