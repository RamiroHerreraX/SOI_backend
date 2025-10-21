const { Pool } = require('pg');
const { config } = require('../config/config');

const pool = new Pool({
  user: config.dbUser,
  host: config.dbHost,
  database: config.dbName,
  password: config.dbPassword,
  port: config.dbPort,
});

pool.on('connect', () => console.log('Conectado a PostgreSQL'));
pool.on('error', (err) => console.error('Error de conexión', err));

module.exports = pool;

