const Ajv = require('ajv');
const ajv = new Ajv({ coerceTypes: true, allErrors: true });

const configSchema = {
  type: 'object',
  properties: {
    PORT: {
      type: 'integer',
      minimum: 1,
      maximum: 65535,
    },
    HOSTNAME: {
      type: 'string',
      minLength: 1,
    },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'production'],
    },
  },
  required: ['PORT', 'HOSTNAME', 'NODE_ENV'],
};

const validateConfig = ajv.compile(configSchema);

module.exports = {
  validateConfig,
};
