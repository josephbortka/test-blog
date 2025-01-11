import express from "express"
import bodyParser from "body-parser"
import { dirname, join} from "path";
import { fileURLToPath } from "url";
import path from "path";
import nodemailer from "nodemailer";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url))
const currentYear = new Date().getFullYear();
const date = new Date();
const DATABASE_PATH = join(__dirname, "database.json");

const transporter = nodemailer.createTransport({
    service: "gmail", // Replace with your email provider
    auth: {
      user: process.env.EMAIL_USER, // Use environment variable for security
      pass: process.env.EMAIL_PASS, // Use environment variable for security
    },
});

class BlogPost {
    constructor(title, body) {
        this.title = title;
        this.body = body
        this.date =  this.date = date.toISOString();
        this.link = `/${this.generateSlug(title)}-${this.date}`;
    }
    generateSlug(title) {
        return title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
      }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));


app.get(["/","/home"], (req, res) => {
    res.render("index.ejs", {year: currentYear, bodyContent: path.join(__dirname, "views", "partials", "home.ejs")});
});
app.get("/new",(req,res) => {
    res.render("index.ejs", {year: currentYear, bodyContent: path.join(__dirname, "views", "partials", "write-blog-post.ejs")});
});
app.get("/contents",(req,res) => {
    // 1. Read the JSON database
    let database = [];
    if (fs.existsSync(DATABASE_PATH)) {
        const data = fs.readFileSync(DATABASE_PATH, "utf8");
        database = JSON.parse(data);
    }
    res.render("index.ejs", {
        year: currentYear, 
        bodyContent: path.join(__dirname, "views", "partials", "contents.ejs"),
        posts: database
    });
});
app.get("/contact",(req,res) => {

    res.render("index.ejs", {
        year: currentYear,
        bodyContent: path.join(__dirname, "views", "partials", "contact.ejs"),
    });
});
app.get("/:slug", (req, res) => {
    // 1. Read the database
    let database = [];
    if (fs.existsSync(DATABASE_PATH)) {
      const data = fs.readFileSync(DATABASE_PATH, "utf8");
      database = JSON.parse(data);
    }
  
    // 2. The user visited /some-slug (e.g., /my-first-post-2025-01-12T00:00:00.000Z)
    //    Reconstruct the link to match your stored link format (leading slash).
    const requestedSlug = `/${req.params.slug}`;
  
    // 3. Find the post that matches requestedSlug
    const foundPost = database.find((post) => post.link === requestedSlug);
  
    // 4. If not found, send a 404 or a friendly message
    if (!foundPost) {
      return res.status(404).send("Post not found.");
    }
  
    // 5. Render a partial (e.g., single-post.ejs) that displays the <h2> and <p>.
    //    Or you could inline the HTML in your main template. We’ll assume you have
    //    a partial named single-post.ejs in views/partials.
    res.render("index.ejs", {
      year: currentYear,
      bodyContent: path.join(__dirname, "views", "partials", "single-post.ejs"),
      post: foundPost,
    });
});

// POST route to create a new blog post
app.post("/submit-blog", (req, res) => {
    console.log("Received form data:", req.body); // Log the incoming data
    const { title, body } = req.body;
  
    // Create a new BlogPost instance
    const newPost = new BlogPost(title, body);
  
    // Read existing database or initialize an empty array
    let database = [];
    if (fs.existsSync(DATABASE_PATH)) {
      const data = fs.readFileSync(DATABASE_PATH, "utf8");
      database = JSON.parse(data);
    }
  
    // Add the new post to the database
    database.push({
      title: newPost.title,
      body: newPost.body,
      date: newPost.date,
      link: newPost.link,
    });
  
    // Write the updated database to the file
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(database, null, 2), "utf8");
  
    console.log("New blog post created:", newPost);
  
    // Redirect the user to the contents page
    res.redirect("/contents");
  });

  app.post("/delete-post", (req, res) => {
    const { link } = req.body;
  
    // Read the existing database
    let database = [];
    if (fs.existsSync(DATABASE_PATH)) {
      const data = fs.readFileSync(DATABASE_PATH, "utf8");
      database = JSON.parse(data);
    }
  
    // Filter out the post with the matching link
    const updatedDatabase = database.filter((post) => post.link !== link);
  
    // Write the updated database back to the file
    fs.writeFileSync(DATABASE_PATH, JSON.stringify(updatedDatabase, null, 2), "utf8");
  
    console.log(`Post with link ${link} has been deleted.`);
  
    // Redirect back to the contents page
    res.redirect("/contents");
  });
  

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});