import express from "express";
import Blog from "../models/Blog.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all published blogs with pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query = { status: "published" };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const blogs = await Blog.find(query)
      .populate("author", "name email avatar")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email avatar");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blogs by author
router.get("/author/:authorId", async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.authorId })
      .populate("author", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new blog
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, featuredImage } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (content.length < 100) {
      return res.status(400).json({ error: "Content must be at least 100 characters" });
    }

    const blog = new Blog({
      title,
      content,
      excerpt: excerpt || content.substring(0, 150),
      category: category || "Travel Guide",
      tags: tags || [],
      featuredImage: featuredImage || "",
      author: req.user.id,
      status: "pending",
    });

    await blog.save();
    await blog.populate("author", "name email avatar");
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog
router.put("/:id", authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this blog" });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("author", "name email avatar");

    res.json(updatedBlog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike blog
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (!blog.likedBy) blog.likedBy = [];

    const userIndex = blog.likedBy.indexOf(req.userId);

    if (userIndex > -1) {
      // Unlike
      blog.likedBy.splice(userIndex, 1);
    } else {
      // Like
      blog.likedBy.push(req.userId);
    }

    blog.likes = blog.likedBy.length;
    await blog.save();

    res.json({ likes: blog.likes, isLiked: userIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish blog (change status to published)
router.put("/:id/publish", authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Only author or admin can publish
    if (blog.author.toString() !== req.userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    blog.status = "published";
    blog.publishedAt = new Date();
    await blog.save();
    await blog.populate("author", "name email avatar");

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
