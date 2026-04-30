CREATE TABLE IF NOT EXISTS users (
    address TEXT PRIMARY KEY,
    role TEXT CHECK (role IN ('participant', 'requester')),
    nonce TEXT
);

CREATE TABLE IF NOT EXISTS consents (
    id SERIAL PRIMARY KEY,
    participant TEXT NOT NULL,
    requester_id INTEGER NOT NULL,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    CONSTRAINT unique_participant_requester UNIQUE (participant, requester_id)
);

CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    participant TEXT NOT NULL,
    requester_address TEXT NOT NULL,
    requester_name TEXT,
    data_id TEXT,
    purpose TEXT,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMP,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP
);
