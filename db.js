// load database settings
require("dotenv").config();

const { Pool } = require("pg");

// set up reusable connection
const db = new Pool({
    connectionTimeoutMillis: 5000
});

module.exports = db;