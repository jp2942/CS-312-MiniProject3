-- password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add demo users
INSERT INTO users (user_id, password, name)
VALUES
    ('jaden', crypt('Sedona123', gen_salt('bf', 10)), 'Jaden'),
    ('sandy', crypt('Hiking123', gen_salt('bf', 10)), 'Sandy'),
    ('alex', crypt('Travel123', gen_salt('bf', 10)), 'Alex');