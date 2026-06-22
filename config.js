const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const HOSTNAME = process.env.HOSTNAME || null;
const NODE_ENV = process.env.NODE_ENV || null;

const errors = [];

if (!PORT || isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  errors.push("Помилка: Змінна PORT має бути коректним числом (1-65535).");
}

if (!HOSTNAME || HOSTNAME.trim() === "") {
  errors.push("Помилка: Змінна HOSTNAME не може бути порожньою.");
}

const validEnvs = ["development", "production"];
if (!NODE_ENV || !validEnvs.includes(NODE_ENV)) {
  errors.push("Помилка: Змінна NODE_ENV має бути або 'development', або 'production'.");
}

if (errors.length > 0) {
  errors.forEach(err => console.error(`\x1b[31m[CONFIG ERROR]\x1b[0m ${err}`));
  process.exit(1);
}

module.exports = {
  PORT,
  HOSTNAME,
  NODE_ENV
};