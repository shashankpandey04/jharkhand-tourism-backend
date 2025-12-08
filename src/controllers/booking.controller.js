import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { catchAsyncErrors } from '../middleware/errorHandler.js';
import AppError from '../middleware/errorHandler.js';

// Create booking
export const createBooking = catchAsyncErrors(async (req, res, next) => {
  const { hotelId, rooms, guestDetails, checkInDate, checkOutDate, specialRequests } = req.body;

  // Validate dates
  if (new Date(checkInDate) >= new Date(checkOutDate)) {
    return next(new AppError('Check-out date must be after check-in date', 400));
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  // Validate and fetch rooms
  let totalPrice = 0;
  const bookingRooms = [];

  for (const roomData of rooms) {
    const room = await Room.findById(roomData.roomId);
    if (!room) {
      return next(new AppError(`Room ${roomData.roomId} not found`, 404));
    }

    if (room.availableRooms < roomData.quantity) {
      return next(
        new AppError(
          `Only ${room.availableRooms} rooms available for ${room.roomType}`,
          400
        )
      );
    }

    const nights = Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
    );
    const roomPrice = room.discountedPrice || room.basePrice;
    const finalPrice = roomPrice * nights * roomData.quantity;

    bookingRooms.push({
      room: room._id,
      roomType: room.roomType,
      quantity: roomData.quantity,
      basePrice: roomPrice,
      finalPrice,
    });

    totalPrice += finalPrice;
  }

  const numberOfNights = Math.ceil(
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
  );

  // Calculate taxes (18% GST for India)
  const taxesAndFees = totalPrice * 0.18;
  const totalWithTax = totalPrice + taxesAndFees;

  const booking = new Booking({
    user: req.user.id,
    hotel: hotelId,
    rooms: bookingRooms,
    guestDetails,
    checkInDate,
    checkOutDate,
    numberOfNights,
    numberOfGuests: guestDetails.numberOfGuests || 1,
    pricing: {
      roomCharges: totalPrice,
      taxesAndFees,
      totalPrice: totalWithTax,
      priceBreakdown: {
        perNightPrice: totalPrice / numberOfNights,
        numberOfNights,
      },
    },
    cancellationPolicy: hotel.cancellationPolicy || {},
    notes: specialRequests,
  });

  booking.confirmationNumber = booking.generateConfirmationNumber();

  await booking.save();

  // Update available rooms
  for (const roomData of rooms) {
    await Room.findByIdAndUpdate(
      roomData.roomId,
      { $inc: { availableRooms: -roomData.quantity } },
      { new: true }
    );
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

// Get all bookings (user's or admin)
export const getAllBookings = catchAsyncErrors(async (req, res, next) => {
  let query;

  if (req.user.role === 'Admin') {
    query = Booking.find({ deletedAt: null });
  } else {
    query = Booking.find({ user: req.user.id, deletedAt: null });
  }

  const bookings = await query
    .populate('user', 'name email phone')
    .populate('hotel', 'name city')
    .populate('rooms.room', 'roomType basePrice')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// Get booking by ID
export const getBooking = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('hotel', 'name city address')
    .populate('rooms.room', 'roomType basePrice amenities')
    .populate('payment');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Check authorization
  if (booking.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized to access this booking', 403));
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// Get booking by confirmation number
export const getBookingByConfirmation = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findOne({
    confirmationNumber: req.params.confirmationNumber,
  })
    .populate('user', 'name email phone')
    .populate('hotel', 'name city')
    .populate('rooms.room', 'roomType');

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// Update booking
export const updateBooking = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized to update this booking', 403));
  }

  if (booking.status !== 'Pending' && booking.status !== 'Confirmed') {
    return next(new AppError('Can only modify pending or confirmed bookings', 400));
  }

  const { guestDetails, specialRequests } = req.body;

  if (guestDetails) {
    booking.guestDetails = { ...booking.guestDetails, ...guestDetails };
  }

  if (specialRequests) {
    booking.notes = specialRequests;
    booking.isModified = true;
    booking.modifications.push({
      modifiedAt: new Date(),
      modifiedBy: req.user.id,
      changes: 'Special requests updated',
    });
  }

  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking updated successfully',
    data: booking,
  });
});

// Cancel booking
export const cancelBooking = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  if (booking.status === 'Checked-Out' || booking.status === 'Cancelled') {
    return next(new AppError(`Cannot cancel ${booking.status} booking`, 400));
  }

  const canCancel = booking.canBeCancelled();
  const refundAmount = booking.calculateRefund();

  booking.status = 'Cancelled';
  booking.cancellation = {
    reason: req.body.reason || 'User requested cancellation',
    cancelledAt: new Date(),
    cancelledBy: req.user.role === 'Admin' ? 'Admin' : 'User',
    refundAmount,
    refundStatus: canCancel ? 'Pending' : 'Processed',
  };

  await booking.save();

  // If there's a payment, initiate refund
  if (booking.payment) {
    const payment = await Payment.findById(booking.payment);
    if (payment && payment.status === 'Success') {
      await payment.initiateRefund(refundAmount, 'Booking cancelled');
    }
  }

  // Release rooms
  for (const room of booking.rooms) {
    await Room.findByIdAndUpdate(
      room.room,
      { $inc: { availableRooms: room.quantity } },
      { new: true }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking,
      refundAmount,
      message: canCancel ? 'Full refund will be processed' : 'Non-refundable booking',
    },
  });
});

// Check-in
export const checkIn = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.status !== 'Confirmed') {
    return next(new AppError('Only confirmed bookings can be checked in', 400));
  }

  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);

  if (now < checkInDate) {
    return next(new AppError('Check-in date has not arrived yet', 400));
  }

  booking.status = 'Checked-In';
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Checked in successfully',
    data: booking,
  });
});

// Check-out
export const checkOut = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.status !== 'Checked-In') {
    return next(new AppError('Only checked-in bookings can be checked out', 400));
  }

  booking.status = 'Checked-Out';
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Checked out successfully',
    data: booking,
  });
});

// Get booking statistics
export const getBookingStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Booking.aggregate([
    {
      $match: { deletedAt: null },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalPrice' },
      },
    },
  ]);

  const totalBookings = await Booking.countDocuments({ deletedAt: null });
  const totalRevenue = await Booking.aggregate([
    { $match: { deletedAt: null, status: 'Checked-Out' } },
    { $group: { _id: null, total: { $sum: '$pricing.totalPrice' } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0,
      byStatus: stats,
    },
  });
});

// Get hotel bookings (for hotel owner)
export const getHotelBookings = catchAsyncErrors(async (req, res, next) => {
  const hotel = await Hotel.findById(req.params.hotelId);

  if (!hotel) {
    return next(new AppError('Hotel not found', 404));
  }

  if (hotel.owner.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  const bookings = await Booking.find({
    hotel: req.params.hotelId,
    deletedAt: null,
  })
    .populate('user', 'name email phone')
    .populate('rooms.room', 'roomType')
    .sort('-checkInDate');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// Delete booking (soft delete)
export const deleteBooking = catchAsyncErrors(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (req.user.role !== 'Admin') {
    return next(new AppError('Only admins can delete bookings', 403));
  }

  booking.deletedAt = new Date();
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Booking deleted successfully',
  });
});
