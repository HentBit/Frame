require('dotenv').config();
const { validateConfig } = require('./validators/config.validator');

const envData = {
  PORT: process.env.PORT,
  HOSTNAME: process.env.HOSTNAME,
  NODE_ENV: process.env.NODE_ENV,
};

const isValid = validateConfig(envData);

if (!isValid) {
  console.error('\x1b[31m[CONFIG ERROR] Некоректні змінні оточення:\x1b[0m');

  validateConfig.errors.forEach((err) => {
    console.error(`- Поле "Data${err.instancePath}" ${err.message}`);
  });

  process.exit(1);
}

module.exports = envData;
