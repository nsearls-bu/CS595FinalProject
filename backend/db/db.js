const { Pool } = require("pg");

/**
 * CREATE TABLE consents (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, granted_at TIMESTAMP, revoked_at TIMESTAMP);
 * CREATE TABLE access_requests (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
 * 
 * use psql dyanmic_consent to get into the psql shell
 * use \dt to check the tables within the current database
 */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

module.exports = pool;
