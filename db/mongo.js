import fp from "fastify-plugin";
import mongoose from "mongoose";

async function mongoPlugin(fastify) {
  try {
    await mongoose.connect(fastify.config.MONGO_URL, {
      dbName: fastify.config.MONGO_DB_NAME
    });

    fastify.log.info("MongoDB connected successfully");
    
    // Експортуємо інстанс з'єднання через декоратор
    fastify.decorate("db", mongoose.connection);
  } catch (err) {
    fastify.log.error(err, "MongoDB connection error");
    process.exit(1);
  }

  fastify.addHook("onClose", async () => {
    await mongoose.connection.close();
    fastify.log.info("MongoDB connection closed");
  });
}

export default fp(mongoPlugin, { name: "mongo-plugin" });