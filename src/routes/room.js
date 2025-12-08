import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import {
  createRoom,
  getHotelRooms,
  getRoom,
  updateRoom,
  getAvailableRooms,
  getRoomsByType,
  applyDiscount,
  deleteRoom,
  getRoomStats,
} from '../controllers/room.controller.js';

const router = express.Router();

// Public routes
router.get('/:id', getRoom);
router.get('/hotel/:hotelId/rooms', getHotelRooms);
router.get('/hotel/:hotelId/available', getAvailableRooms);
router.get('/hotel/:hotelId/type/:roomType', getRoomsByType);

// Protected routes
router.post('/hotel/:hotelId', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), createRoom);
router.put('/:id', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), updateRoom);
router.delete('/:id', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), deleteRoom);
router.post('/:roomId/discount', authenticate, authorizeRoles('Hotel_Owner', 'Admin'), applyDiscount);

// Statistics
router.get('/hotel/:hotelId/stats', authenticate, getRoomStats);

export default router;
