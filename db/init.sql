CREATE TABLE IF NOT EXISTS users (
    address TEXT PRIMARY KEY,
    role TEXT CHECK (role IN ('participant', 'requester')),
    nonce TEXT
);


CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    participant TEXT NOT NULL,
    requester_address TEXT NOT NULL,
    requester_name TEXT,
    data_id TEXT,
    purpose TEXT,
    requested_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consents (
    request_id TEXT PRIMARY KEY,
    participant TEXT NOT NULL,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP
);
