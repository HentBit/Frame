export const envSchema = {
  type: "object",
  required: [
    "PORT",
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DB"
  ],
  properties: {
    PORT: { type: "integer", default: 3000 },
    MYSQL_HOST: { type: "string" },
    MYSQL_PORT: { type: "integer", default: 3306 },
    MYSQL_USER: { type: "string" },
    MYSQL_PASSWORD: { type: "string" },
    MYSQL_DB: { type: "string" }
  }
};
