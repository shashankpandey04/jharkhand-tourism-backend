import express from "express";
import Review from "../models/Review.js";
import Place from "../models/Place.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all reviews with filtering and pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "approved", sort = "newest", place, author } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (place) query.place = place;
    if (author) query.author = author;

    const skip = (page - 1) * limit;
    
    // Determine sort order
    let sortObj = { createdAt: -1 }; // default newest
    if (sort === "oldest") sortObj = { createdAt: 1 };
    if (sort === "highestRating") sortObj = { rating: -1 };
    if (sort === "lowestRating") sortObj = { rating: 1 };
    if (sort === "mostHelpful") sortObj = { helpfulCount: -1 };

    const reviews = await Review.find(query)
      .populate("author", "name email avatar")
      .populate("place", "name")
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj);

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

// Get review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("author", "name email avatar")
      .populate("place", "name description");
    
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews by place
router.get("/place/:placeId", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "newest" } = req.query;
    const skip = (page - 1) * limit;

    let sortObj = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    if (sort === "highestRating") sortObj = { rating: -1 };

    const reviews = await Review.find({ place: req.params.placeId, status: "approved" })
      .populate("author", "name email avatar")
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortObj);

    const total = await Review.countDocuments({ place: req.params.placeId, status: "approved" });

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

// Get reviews by author
router.get("/author/:authorId", async (req, res) => {
  try {
    const reviews = await Review.find({ author: req.params.authorId })
      .populate("author", "name email avatar")
      .populate("place", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, rating, place, images } = req.body;

    if (!title || !content || !rating || !place) {
      return res.status(400).json({ error: "Title, content, rating, and place are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if place exists
    const placeExists = await Place.findById(place);
    if (!placeExists) {
      return res.status(404).json({ error: "Place not found" });
    }

    const review = new Review({
      title,
      content,
      rating,
      place,
      author: req.userId,
      images: images || [],
      status: "pending", // New reviews are pending moderation
    });

    await review.save();
    await review.populate("author", "name email avatar");

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put("/:id", authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user is author or admin
    if (review.author.toString() !== req.userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this review" });
    }

    const updatedReview = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("author", "name email avatar");

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user is author or admin
    if (review.author.toString() !== req.userId && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark review as helpful
router.post("/:id/helpful", authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user already marked as helpful
    if (!review.helpfulBy) review.helpfulBy = [];
    
    const userIndex = review.helpfulBy.indexOf(req.userId);

    if (userIndex > -1) {
      // Remove helpful vote
      review.helpfulBy.splice(userIndex, 1);
    } else {
      // Add helpful vote
      review.helpfulBy.push(req.userId);
    }

    review.helpfulCount = review.helpfulBy.length;
    await review.save();

    res.json({ helpful: review.helpfulCount, isHelpful: userIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark review as not helpful
router.post("/:id/not-helpful", authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user already marked as not helpful
    if (!review.notHelpfulBy) review.notHelpfulBy = [];
    
    const userIndex = review.notHelpfulBy.indexOf(req.userId);

    if (userIndex > -1) {
      // Remove not helpful vote
      review.notHelpfulBy.splice(userIndex, 1);
    } else {
      // Add not helpful vote
      review.notHelpfulBy.push(req.userId);
    }

    review.notHelpfulCount = review.notHelpfulBy.length;
    await review.save();

    res.json({ notHelpful: review.notHelpfulCount, isNotHelpful: userIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
