const { Pool } = require("pg");

/**
 * CREATE TABLE consents (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, granted_at TIMESTAMP, revoked_at TIMESTAMP);
 * CREATE TABLE access_requests (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
 * CREATE TABLE users (address TEXT PRIMARY KEY, role TEXT CHECK (role IN ('participant','requester')), nonce TEXT);
 *
 * use psql dyanmic_consent to get into the psql shell (psql -U wyattnapier -d dynamic_consent)
 * use \dt to check the tables within the current database
 *
 * NOTE: had to update consents as follow to add uniqueness constraints:
 *  ALTER TABLE consents ADD CONSTRAINT unique_participant_requester UNIQUE (participant, requester_id);
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
