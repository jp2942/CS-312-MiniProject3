const db = require("./db");

// checks the connection and count saved data
async function testConnection() {
    try {
        const result = await db.query(`
            SELECT current_database() AS database,
                (SELECT COUNT(*) FROM users) AS users,
                (SELECT COUNT(*) FROM blogs) AS blogs
        `);

        console.log(result.rows[0]);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

testConnection();