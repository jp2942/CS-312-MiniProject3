const express = require("express"); // Set up Express and create the app
const app = express();
const db = require("./db");
const session = require("express-session");
app.set("view engine", "ejs"); // Use EJS templates to display the pages
app.use(express.urlencoded({ extended: false })); // Make submitted form fields available in req.body
app.use(express.static("public")); // Serve files from the public folder

// Stay signed in
app.use(session({
    name: "blog.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000
    }
}));

// Show signup form
app.get("/signup", function (req, res) {
    res.render("signup", { error: null });
});

// Show signin form
app.get("/signin", function (req, res) {
    res.render("signin", { error: null });
});

// Check the user ID and save a new account
app.post("/signup", async function (req, res) {
    const userId = (req.body.user_id || "").trim();
    const password = req.body.password || "";
    const name = (req.body.name || "").trim();

    // Check if valid account
    if (!userId || !password.trim() || !name) {
        return res.status(400).render("signup", {
            error: "Some fields are not filled in"
        });
    }

    if (userId.length > 255 || name.length > 255 ||
        Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).render("signup", {
            error: "Your user ID, name, or password is too long"
        });
    }

    try {
        // Check if user id is taken
        const result = await db.query(
            "SELECT user_id FROM users WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length > 0) {
            return res.status(409).render("signup", {
                error: "User ID has been snatched already"
            });
        }

        // Hash the password
        await db.query(
            `INSERT INTO users (user_id, password, name)
             VALUES ($1, crypt($2, gen_salt('bf', 10)), $3)`,
            [userId, password, name]
        );

        res.redirect("/signin");
    } catch (error) {
        console.error("Signup failed:", error.message);

        res.status(error.code === "23505" ? 409 : 500).render("signup", {
            error: error.code === "23505"
                ? "User ID has been snatched already"
                : "Sorry, try that again"
        });
    }
});

// Check login information to start session
app.post("/signin", async function (req, res) {
    const userId = (req.body.user_id || "").trim();
    const password = req.body.password || "";

    if (!userId || !password ||
        Buffer.byteLength(password, "utf8") > 72) {
        return res.status(401).render("signin", {
            error: "User ID or password not right"
        });
    }

    try {
        // Compare with pass hash
        const result = await db.query(
            `SELECT user_id, name FROM users
             WHERE user_id = $1
             AND password = crypt($2, password)`,
            [userId, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).render("signin", {
                error: "User ID or password not right"
            });
        }

        // New session after a successful login
        req.session.regenerate(function (error) {
            if (error) {
                return res.status(500).render("signin", {
                    error: "Please try again, could not log in"
                });
            }

            req.session.user = result.rows[0];

            // Save the session
            req.session.save(function (error) {
                if (error) {
                    return res.status(500).render("signin", {
                        error: "Please try again, could not log in"
                    });
                }

                res.redirect("/");
            });
        });
    } catch (error) {
        console.error("Signin failed:", error.message);

        res.status(500).render("signin", {
            error: "Please try again, could not log in"
        });
    }
});

// Log out and return to signin
app.post("/logout", function (req, res) {
    req.session.destroy(function (error) {
        if (error) {
            return res.status(500).send(
                "Please try again"
            );
        }

        res.clearCookie("blog.sid", { path: "/" });
        res.redirect("/signin");
    });
});

// Display blog posts for signed-in users
app.get("/", async function (req, res) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    try {
        const result = await db.query(`
            SELECT
                blog_id AS id,
                creator_name AS author,
                creator_user_id,
                title,
                body AS content,
                date_created AS "createdAt"
            FROM blogs
            ORDER BY date_created DESC, blog_id DESC
        `);

        res.render("index", {
            posts: result.rows,
            user: req.session.user
        });
    } catch (error) {
        console.error("Could not load posts:", error.message);
        res.status(500).send("Please try again");
    }
});

// Open the edit form for the poster
app.get("/posts/:id/edit", async function (req, res) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) ||
        postId < 1 || postId > 2147483647) {
        return res.status(400).send("Not an ID");
    }

    try {
        const result = await db.query(
            `SELECT blog_id AS id, creator_name AS author,
                    creator_user_id, title, body AS content
             FROM blogs
             WHERE blog_id = $1`,
            [postId]
        );

        const post = result.rows[0];

        if (!post) {
            return res.status(404).send("Post not found");
        }

        // Compare IDs
        if (post.creator_user_id !== req.session.user.user_id) {
            return res.status(403).send(
                "You can only edit your own post"
            );
        }

        res.render("edit", { post: post });
    } catch (error) {
        console.error("Could not load edit form:", error.message);
        res.status(500).send("Please try again");
    }
});

// Save changes when the signedin user owns the post
app.post("/posts/:id/edit", async function (req, res) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    const postId = Number(req.params.id);
    const title = (req.body.title || "").trim();
    const content = (req.body.content || "").trim();

    if (!Number.isInteger(postId) ||
        postId < 1 || postId > 2147483647) {
        return res.status(400).send("Invalid post ID.");
    }

    if (!title || !content || title.length > 255) {
        return res.status(400).send(
            'Enter a title and some content <a href="/">Return to home</a>'
        );
    }

    try {
        // Update only a post belonging to this account
        const result = await db.query(
            `UPDATE blogs
             SET title = $1, body = $2
             WHERE blog_id = $3 AND creator_user_id = $4`,
            [title, content, postId, req.session.user.user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send(
                "Post not found, or do not have permission to edit it"
            );
        }

        res.redirect("/");
    } catch (error) {
        console.error("Could not update post:", error.message);
        res.status(500).send("Please try again");
    }
});

// Delete a saved post when the user owns it
app.post("/posts/:id/delete", async function (req, res) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) ||
        postId < 1 || postId > 2147483647) {
        return res.status(400).send("Invalid post ID");
    }

    try {
        const result = await db.query(
            `DELETE FROM blogs
             WHERE blog_id = $1 AND creator_user_id = $2`,
            [postId, req.session.user.user_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).send(
                "Post not found, or no permission to delete it"
            );
        }

        res.redirect("/");
    } catch (error) {
        console.error("Could not delete post:", error.message);
        res.status(500).send("Please try again");
    }
});

// Save a blog post tied to the signedin user
app.post("/posts", async function (req, res) {
    if (!req.session.user) {
        return res.redirect("/signin");
    }

    const title = (req.body.title || "").trim();
    const content = (req.body.content || "").trim();

    // Reject empty posts or ones that exceed
    if (!title || !content || title.length > 255) {
        return res.status(400).send(
            'Enter a title and some content, max of 255. <a href="/">Return to home</a>'
        );
    }

    try {
        await db.query(
            `INSERT INTO blogs
                (creator_name, creator_user_id, title, body)
             VALUES ($1, $2, $3, $4)`,
            [
                req.session.user.name,
                req.session.user.user_id,
                title,
                content
            ]
        );

        res.redirect("/");
    } catch (error) {
        console.error("Couldnt create post:", error.message);

        res.status(500).send(
            'Couldnt save your post. <a href="/">Return to the home</a>'
        );
    }
});

// Start the server on port 3000
app.listen(3000, function () {
  console.log("Server running at http://localhost:3000");
});