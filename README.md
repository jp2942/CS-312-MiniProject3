# Sedona Travel Blog

Jaden Patel — CS-312 Mini-Project 3

This project builds on my first Sedona blog using Node.js, Express, EJS, CSS, and PostgreSQL. Users can sign in and share travel experiences. Posts are saved in the database and stay after restarting the server.

## Features

- Sign up, sign in, and log out.
- Create posts with a title and content.
- View posts with the author's name and creation date.
- Edit and delete only your own posts.
- Use the site on different screen sizes.

## Running the Project

Make sure Node.js, npm, and PostgreSQL are installed.

1. Clone the repository and open the project folder.
2. Run npm install.
3. Create a database named blogdb in pgAdmin.
4. Run database/schema.sql, then database/seed.sql in that database. Run the seed file once to add the starting users and posts.
5. Copy .env.example to .env and fill in your database settings and a random SESSION_SECRET.
6. Run node index.js.

Open http://localhost:3000 in your browser. Press Ctrl+C in the terminal to stop the server.

## Main Files

- index.js handles the server, accounts, and blog routes.
- db.js connects to PostgreSQL.
- views contains the feed, edit, signup, and signin pages.
- public/styles.css styles the pages.
- database contains the table setup and starting entries.

## Testing

I tested signing up, signing in, creating posts, editing, and deleting. I also checked that users can only change their own posts and that posts stay saved after restarting the server.