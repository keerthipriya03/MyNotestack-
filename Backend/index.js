import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js"; 
import Post from "./models/Post.js"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;

// REGISTER
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", userID: newUser._id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.status(200).json({ message: "Login successful", userID: user._id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error. Please try again later" });
  }
});


// Create a new post
app.post("/createpost", async (req, res) => {
  try {
    const { postTitle, postDescription, userID } = req.body;

    if (!postTitle || !postDescription || !userID)
      return res.status(400).send("All fields are required");

    const newPost = new Post({ postTitle, postDescription, userID });
    await newPost.save();

    res.status(201).send("Post created successfully");
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).send("Server error while creating post");
  }
});


// Get all posts 
app.get("/getMyPosts", async (req, res) => {
  try {
    const { userID } = req.query;
    if (!userID) return res.status(400).send("User ID missing");

    const posts = await Post.find({ userID }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Get my posts error:", err);
    res.status(500).send("Server error while fetching posts");
  }
});


// Get post by ID 
app.get("/getPostById", async (req, res) => {
  try {
    const { postID } = req.query;
    if (!postID) return res.status(400).send("Post ID missing");

    const post = await Post.findById(postID);
    if (!post) return res.status(404).send("Post not found");

    res.json(post);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).send("Server error while fetching post");
  }
});


// Edit a post
app.put("/editPost", async (req, res) => {
  try {
    const { postID, postTitle, postDescription, userID } = req.body;

    const post = await Post.findById(postID);
    if (!post) return res.status(404).send("Post not found");
    if (post.userID.toString() !== userID) return res.status(403).send("Unauthorized");

    post.postTitle = postTitle;
    post.postDescription = postDescription;
    await post.save();

    res.send("Post updated successfully");
  } catch (err) {
    console.error("Edit post error:", err);
    res.status(500).send("Server error while editing post");
  }
});


// Delete a post
app.delete("/deletePost", async (req, res) => {
  try {
    const { postID, userID } = req.body;

    const post = await Post.findById(postID);
    if (!post) return res.status(404).send("Post not found");
    if (post.userID.toString() !== userID) return res.status(403).send("Unauthorized");

    await Post.findByIdAndDelete(postID);
    res.send("Post deleted successfully");
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).send("Server error while deleting post");
  }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
