-- password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add demo users
INSERT INTO users (user_id, password, name)
VALUES
    ('jaden', crypt('Sedona123', gen_salt('bf', 10)), 'Jaden'),
    ('sandy', crypt('Hiking123', gen_salt('bf', 10)), 'Sandy'),
    ('alex', crypt('Travel123', gen_salt('bf', 10)), 'Alex');

-- Add five starting posts
INSERT INTO blogs
    (creator_name, creator_user_id, title, body, date_created)
VALUES
    ('Jaden', 'jaden', 'First Weekend in Sedona',
     'I spent the weekend exploring Sedona. The red rock views were amazing',
     '2026-09-20 10:00:00'),

    ('Sandy', 'sandy', 'Morning Hike',
     'We started our hike early. It was nice to enjoy the trail before the afternoon heat.',
     '2026-09-21 08:30:00'),

    ('Alex', 'alex', 'Exploring',
     'I walked around Uptown and visited Mi Amore Sedona. It was the best gift shop!',
     '2026-09-22 15:00:00'),

    ('Jaden', 'jaden', 'Sunset Views',
     'Went on a hike and found a nice sunset spot',
     '2026-09-23 18:00:00'),

    ('Sandy', 'sandy', 'Planning My Next Visit',
     'Next time I visit Sedona, I want to spend more time exploring local restaurants.',
     '2026-09-24 12:00:00');