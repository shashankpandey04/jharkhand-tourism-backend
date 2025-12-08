import express from "express";
import Review from "../models/Review.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get hotel reviews
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, rating, hotel } = req.body;

    if (!title || !content || !rating || !hotel) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    const review = new Review({
      title,
      content,
      rating,
      hotel,
      author: req.userId,
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update review
router.put("/:id", authenticate, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete review
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
