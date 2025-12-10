import express from "express";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Review from "../models/Review.js";
import Place from "../models/Place.js";
import { authenticate } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

// Middleware to check admin role
const checkAdmin = [authenticate, authorizeRoles("admin")];

// ============== USER MANAGEMENT ==============

// Get all users
router.get("/users", checkAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/users/:id", checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put("/users/:id", checkAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete("/users/:id", checkAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== BLOG MANAGEMENT ==============

// Get all blogs for moderation (all statuses)
router.get("/blogs", checkAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
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
router.get("/blogs/:id", checkAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name email avatar");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update blog (title, content, category, etc)
router.put("/blogs/:id", checkAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status } = req.body;
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, excerpt, category, tags, status },
      { new: true }
    ).populate("author", "name email avatar");

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish blog (change status to published)
router.put("/blogs/:id/publish", checkAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status: "published" },
      { new: true }
    ).populate("author", "name email avatar");

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject blog
router.put("/blogs/:id/reject", checkAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason },
      { new: true }
    ).populate("author", "name email avatar");

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete blog
router.delete("/blogs/:id", checkAdmin, async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== REVIEW MANAGEMENT ==============

// Get all reviews for moderation
router.get("/reviews", checkAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .populate("user", "name email")
      .populate("place", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve review
router.put("/reviews/:id/approve", checkAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("user", "name email");

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject review
router.put("/reviews/:id/reject", checkAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason },
      { new: true }
    ).populate("user", "name email");

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hide/Show review
router.put("/reviews/:id/toggle-visibility", checkAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { isHidden: !review.isHidden },
      { new: true }
    ).populate("user", "name email");

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== PLACE MANAGEMENT ==============

// Get all places
router.get("/places", checkAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    const skip = (page - 1) * limit;
    const places = await Place.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Place.countDocuments(query);

    res.json({
      places,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create place
router.post("/places", checkAdmin, async (req, res) => {
  try {
    const { name, description, category, location, entryFee, bestTimeToVisit, images } = req.body;

    if (!name || !description || !category || !location?.city) {
      return res.status(400).json({ error: "Name, description, category, and city are required" });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const placeData = {
      name,
      description,
      category,
      location: {
        address: location.address || "",
        city: location.city,
        district: location.district || "",
        coordinates: {
          type: "Point",
          coordinates: location.coordinates?.coordinates || [0, 0], // [longitude, latitude]
        },
      },
      entryFee: entryFee || 0,
      bestTimeToVisit: bestTimeToVisit || {},
      images: images.map((img) => ({
        url: img.url,
        alt: img.alt || name,
      })),
    };

    const place = new Place(placeData);
    await place.save();
    res.status(201).json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update place
router.put("/places/:id", checkAdmin, async (req, res) => {
  try {
    const { name, description, category, location, entryFee, bestTimeToVisit, images } = req.body;

    const updateData = {};
    
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (entryFee !== undefined) updateData.entryFee = entryFee;
    if (bestTimeToVisit) updateData.bestTimeToVisit = bestTimeToVisit;
    
    if (location) {
      updateData.location = {
        address: location.address || "",
        city: location.city || "",
        district: location.district || "",
        coordinates: {
          type: "Point",
          coordinates: location.coordinates?.coordinates || [0, 0],
        },
      };
    }

    if (images && images.length > 0) {
      updateData.images = images.map((img) => ({
        url: img.url,
        alt: img.alt || name,
      }));
    }

    const place = await Place.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete place
router.delete("/places/:id", checkAdmin, async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============== STATISTICS ==============

// Get admin statistics
router.get("/stats", checkAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalPlaces = await Place.countDocuments();
    const pendingBlogs = await Blog.countDocuments({ status: "pending" });
    const pendingReviews = await Review.countDocuments({ status: "pending" });

    res.json({
      totalUsers,
      totalBlogs,
      totalReviews,
      totalPlaces,
      pendingBlogs,
      pendingReviews,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
