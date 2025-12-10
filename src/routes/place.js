import express from "express";
import Place from "../models/Place.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all places
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 12, category, city, search } = req.query;
    const query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by city
    if (city) {
      query["location.city"] = { $regex: city, $options: "i" };
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
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

// Get place by ID
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found" });
    res.json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get places by city
router.get("/city/:city", async (req, res) => {
  try {
    const places = await Place.find({ "location.city": req.params.city });
    res.json(places);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create place
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, description, location, category } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: "Name and location required" });
    }

    const place = new Place({
      name,
      description,
      location,
      category,
    });

    await place.save();
    res.status(201).json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update place
router.put("/:id", authenticate, async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(place);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete place
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: "Place deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
