CREATE TABLE IF NOT EXISTS users (
    id SERIAL,
    address TEXT PRIMARY KEY,
    role TEXT CHECK (role IN ('participant', 'requester', 'admin')),
    nonce TEXT,
    organization TEXT,
    purpose TEXT,
    approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS consents (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL UNIQUE,
    participant TEXT NOT NULL,
    requester TEXT NOT NULL,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_requests (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL UNIQUE,
    participant TEXT NOT NULL,
    requester TEXT NOT NULL,
    requester_name TEXT,
    data_id TEXT,
    purpose TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
