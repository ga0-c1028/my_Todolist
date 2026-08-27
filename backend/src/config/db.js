const { Pool } = require('pg');
const { getEnv } = require('./env');

function createPool(databaseUrl) {
  return new Pool({ connectionString: databaseUrl });
}

const pool = createPool(getEnv().databaseUrl);

module.exports = { pool, createPool };
