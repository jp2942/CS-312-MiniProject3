const express = require("express"); // Set up Express and create the app
const app = express();
const db = require("./db");
app.set("view engine", "ejs"); // Use EJS templates to display the pages
app.use(express.urlencoded({ extended: false })); // Make submitted form fields available in req.body
app.use(express.static("public")); // Serve files from the public folder

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

const posts = [] // Store posts in memory
let nextPostId = 1; // Track the ID to assign to the next new post

// Display the homepage with the current list of posts.
app.get("/", function (req, res) { 
  res.render("index", {posts: posts});
});

// Find the selected post and display its filled-in edit form
app.get("/posts/:id/edit", function (req, res) {
    const postId = Number(req.params.id);
    const post = posts.find(function (item) {
        return item.id === postId;
    });
    if (post === undefined) {
    res.status(404).send("Post not found");
    return;
}
    res.render("edit", { post: post });
});

// Save the changes submitted through the edit form
app.post("/posts/:id/edit", function (req, res) {
    const postId = Number(req.params.id);
    const post = posts.find(function (item) {
        return item.id === postId;
    });
    if (post === undefined) {
    res.status(404).send("Post not found");
    return;
}
   post.author = req.body.author;
   post.title = req.body.title;
   post.content = req.body.content;
   res.redirect("/");
});

// Remove the selected post and return to the homepage
app.post("/posts/:id/delete", function (req, res) {
    const postId = Number(req.params.id);
    const postIndex = posts.findIndex(function (item) {
        return item.id === postId;
    });
    if (postIndex !== -1) {
    posts.splice(postIndex,1);
}
    res.redirect("/");
});

// Create a new post using the submitted form fields
app.post("/posts", function (req, res) {
    const newPost = {
        author: req.body.author,
        title: req.body.title,
        content: req.body.content,
        createdAt: new Date(),
        id: nextPostId,
    };
    posts.push(newPost);
    nextPostId = nextPostId + 1;
    console.log(posts);
    res.redirect("/");
});

// Start the server on port 3000
app.listen(3000, function () {
  console.log("Server running at http://localhost:3000");
});