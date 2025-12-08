import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import { catchAsyncErrors } from '../middleware/errorHandler.js';
import AppError from '../middleware/errorHandler.js';

// Create room
export const createRoom = catchAsyncErrors(async (req, res, next) => {
  const { hotelId } = req.params;
  const {
    roomType,
    capacity,
    basePrice,
    pricePerAdditionalGuest,
    totalRooms,
    amenities,
    description,
    features,
    bedType,
    size,
    discount,
    cancellationPolicy,
  } = req.body;

  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized to add rooms to this hotel', 403));
  }

  const room = new Room({
    hotel: hotelId,
    roomType,
    capacity,
    basePrice,
    pricePerAdditionalGuest,
    totalRooms,
    availableRooms: totalRooms,
    amenities,
    description,
    features,
    bedType,
    size,
    discount,
    cancellationPolicy,
  });

  await room.save();

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: room,
  });
});

// Get all rooms for a hotel
export const getHotelRooms = catchAsyncErrors(async (req, res, next) => {
  const { hotelId } = req.params;

  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  const rooms = await Room.find({ hotel: hotelId, isActive: true, deletedAt: null }).sort(
    'roomType'
  );

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// Get room by ID
export const getRoom = catchAsyncErrors(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate('hotel', 'name city');

  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// Update room
export const updateRoom = catchAsyncErrors(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  const hotel = await Hotel.findById(room.hotel);

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Room updated successfully',
    data: room,
  });
});

// Get available rooms for a date range
export const getAvailableRooms = catchAsyncErrors(async (req, res, next) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    return next(new AppError('Check-in and check-out dates are required', 400));
  }

  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Get rooms with availability > 0
  const rooms = await Room.find({
    hotel: hotelId,
    isActive: true,
    availableRooms: { $gt: 0 },
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: {
      hotel: {
        id: hotel._id,
        name: hotel.name,
        city: hotel.city,
      },
      checkInDate,
      checkOutDate,
      rooms,
    },
  });
});

// Get rooms by type
export const getRoomsByType = catchAsyncErrors(async (req, res, next) => {
  const { hotelId, roomType } = req.params;

  const rooms = await Room.find({
    hotel: hotelId,
    roomType,
    isActive: true,
    deletedAt: null,
  });

  if (rooms.length === 0) {
    return next(new AppError('No rooms of this type found', 404));
  }

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// Apply discount to room
export const applyDiscount = catchAsyncErrors(async (req, res, next) => {
  const { roomId } = req.params;
  const { percentage, validFrom, validTo } = req.body;

  const room = await Room.findById(roomId);

  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  const hotel = await Hotel.findById(room.hotel);

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  if (percentage < 0 || percentage > 100) {
    return next(new AppError('Discount percentage must be between 0 and 100', 400));
  }

  room.discount = {
    percentage,
    validFrom: new Date(validFrom),
    validTo: new Date(validTo),
  };

  await room.save();

  res.status(200).json({
    success: true,
    message: 'Discount applied successfully',
    data: room,
  });
});

// Delete room
export const deleteRoom = catchAsyncErrors(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  const hotel = await Hotel.findById(room.hotel);

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  room.deletedAt = new Date();
  await room.save();

  res.status(200).json({
    success: true,
    message: 'Room deleted successfully',
  });
});

// Get room statistics for hotel
export const getRoomStats = catchAsyncErrors(async (req, res, next) => {
  const { hotelId } = req.params;

  const hotel = await Hotel.findById(hotelId);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  const stats = await Room.aggregate([
    {
      $match: { hotel: hotel._id, deletedAt: null },
    },
    {
      $group: {
        _id: '$roomType',
        totalRooms: { $sum: '$totalRooms' },
        availableRooms: { $sum: '$availableRooms' },
        bookedRooms: {
          $sum: {
            $subtract: ['$totalRooms', '$availableRooms'],
          },
        },
        averagePrice: { $avg: '$basePrice' },
        roomCount: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      hotel: {
        id: hotel._id,
        name: hotel.name,
      },
      byRoomType: stats,
    },
  });
});
