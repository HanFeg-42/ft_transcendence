-- Placeholder to verify the init mechanism works.
-- Each service owner should add their own CREATE TABLE statements here

CREATE TABLE IF NOT EXISTS _init_check (
    id SERIAL PRIMARY KEY,
    note TEXT DEFAULT 'init.sql ran successfully',
    created_at TIMESTAMP DEFAULT NOW()
);