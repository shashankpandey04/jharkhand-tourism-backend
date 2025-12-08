import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles, isAdmin } from '../middleware/roles.js';
import {
  createBooking,
  getAllBookings,
  getBooking,
  getBookingByConfirmation,
  updateBooking,
  cancelBooking,
  checkIn,
  checkOut,
  getBookingStats,
  getHotelBookings,
  deleteBooking,
} from '../controllers/booking.controller.js';

const router = express.Router();

// Public routes
router.get('/confirmation/:confirmationNumber', getBookingByConfirmation);

// Protected routes
router.post('/', authenticate, createBooking);
router.get('/', authenticate, getAllBookings);
router.get('/:id', authenticate, getBooking);
router.put('/:id', authenticate, updateBooking);
router.post('/:id/cancel', authenticate, cancelBooking);
router.post('/:id/check-in', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), checkIn);
router.post('/:id/check-out', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), checkOut);

// Hotel owner routes
router.get('/hotel/:hotelId/bookings', authenticate, getHotelBookings);

// Admin routes
router.get('/admin/stats', authenticate, isAdmin, getBookingStats);
router.delete('/:id', authenticate, isAdmin, deleteBooking);

export default router;
