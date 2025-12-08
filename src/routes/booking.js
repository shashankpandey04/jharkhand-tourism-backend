import express from 'express';
import Booking from '../models/Booking.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get booking by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, totalGuests } = req.body;

    if (!room || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const booking = new Booking({
      user: req.userId,
      room,
      checkInDate,
      checkOutDate,
      totalGuests,
      status: 'confirmed',
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking
router.put('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
