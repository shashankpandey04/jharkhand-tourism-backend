import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { catchAsyncErrors } from '../middleware/errorHandler.js';
import AppError from '../middleware/errorHandler.js';

// Initiate payment
export const initiatePayment = catchAsyncErrors(async (req, res, next) => {
  const { bookingId, paymentMethod, cardDetails, upiId, bankName } = req.body;

  const booking = await Booking.findById(bookingId);

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  if (booking.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  if (booking.paymentStatus === 'Paid') {
    return next(new AppError('Booking is already paid', 400));
  }

  const payment = new Payment({
    booking: bookingId,
    user: req.user.id,
    amount: booking.pricing.totalPrice,
    paymentMethod,
    paymentDetails: {
      cardLast4: cardDetails?.last4,
      cardBrand: cardDetails?.brand,
      upiId,
      bankName,
    },
    status: 'Processing',
  });

  await payment.save();

  // In real implementation, integrate with payment gateway (Razorpay, Stripe)
  // For now, return payment gateway request details
  res.status(201).json({
    success: true,
    message: 'Payment initiated',
    data: {
      payment,
      gatewayRequest: {
        amount: payment.amount,
        currency: payment.currency,
        description: `Booking ${booking.bookingId}`,
        receipt: payment.transactionId,
      },
    },
  });
});

// Process payment gateway callback (webhook)
export const processPaymentCallback = catchAsyncErrors(async (req, res, next) => {
  const { transactionId, status, gatewayTransactionId, response } = req.body;

  const payment = await Payment.findOne({ transactionId });

  if (!payment) {
    return next(new AppError('Payment record not found', 404));
  }

  if (status === 'Success') {
    payment.status = 'Success';
    payment.gatewayResponse = {
      gateway: 'Razorpay', // or any other gateway
      gatewayTransactionId,
      response,
    };

    // Update booking
    const booking = await Booking.findById(payment.booking);
    booking.paymentStatus = 'Paid';
    booking.status = 'Confirmed';
    booking.payment = payment._id;
    await booking.save();
  } else if (status === 'Failed') {
    payment.status = 'Failed';
    payment.failureReason = response?.error || 'Payment failed';

    const booking = await Booking.findById(payment.booking);
    booking.paymentStatus = 'Unpaid';
    await booking.save();
  }

  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Payment processed',
    data: payment,
  });
});

// Verify payment
export const verifyPayment = catchAsyncErrors(async (req, res, next) => {
  const { transactionId } = req.params;

  const payment = await Payment.findOne({ transactionId }).populate('booking');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  res.status(200).json({
    success: true,
    data: {
      payment,
      booking: payment.booking,
      status: payment.status,
    },
  });
});

// Get payment details
export const getPayment = catchAsyncErrors(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate('booking user');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// Get user payments
export const getUserPayments = catchAsyncErrors(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id })
    .populate('booking', 'bookingId status checkInDate checkOutDate')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// Request refund
export const requestRefund = catchAsyncErrors(async (req, res, next) => {
  const { paymentId, reason } = req.body;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.user.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  if (payment.status !== 'Success') {
    return next(new AppError('Can only refund successful payments', 400));
  }

  if (payment.refund.refundStatus !== 'Not Initiated') {
    return next(new AppError('Refund already initiated', 400));
  }

  await payment.initiateRefund(payment.amount, reason);

  res.status(200).json({
    success: true,
    message: 'Refund requested successfully',
    data: payment,
  });
});

// Process refund (admin)
export const processRefund = catchAsyncErrors(async (req, res, next) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  if (req.user.role !== 'Admin') {
    return next(new AppError('Only admins can process refunds', 403));
  }

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.status !== 'Success') {
    return next(new AppError('Can only refund successful payments', 400));
  }

  const refundAmount = amount || payment.amount;

  if (refundAmount > payment.amount) {
    return next(new AppError('Refund amount exceeds payment amount', 400));
  }

  payment.refund.refundAmount = refundAmount;
  payment.refund.refundReason = reason || 'Admin initiated refund';
  payment.refund.refundStatus = 'Processed';
  payment.refund.refundCompletedAt = new Date();
  payment.status = refundAmount === payment.amount ? 'Refunded' : 'Partial';

  // In real implementation, trigger payment gateway refund API
  // For now, just mark as processed

  await payment.save();

  // Update booking payment status
  const booking = await Booking.findById(payment.booking);
  if (refundAmount === payment.amount) {
    booking.paymentStatus = 'Refunded';
  } else {
    booking.paymentStatus = 'Partial';
  }
  await booking.save();

  res.status(200).json({
    success: true,
    message: 'Refund processed successfully',
    data: payment,
  });
});

// Get payment statistics (admin)
export const getPaymentStats = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return next(new AppError('Only admins can view payment statistics', 403));
  }

  const stats = await Payment.aggregate([
    {
      $match: { status: 'Success' },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
      },
    },
  ]);

  const byMethod = await Payment.aggregate([
    {
      $match: { status: 'Success' },
    },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  const byStatus = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: stats[0] || {},
      byMethod,
      byStatus,
    },
  });
});

// Download invoice
export const downloadInvoice = catchAsyncErrors(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate('booking user');

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.user._id.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  // Generate invoice (in real implementation, use pdf library)
  const invoice = {
    invoiceNumber: `INV-${payment.transactionId}`,
    date: new Date(),
    payment,
    booking: payment.booking,
  };

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

// Retry failed payment
export const retryPayment = catchAsyncErrors(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return next(new AppError('Payment not found', 404));
  }

  if (payment.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized', 403));
  }

  if (payment.status !== 'Failed') {
    return next(new AppError('Can only retry failed payments', 400));
  }

  if (payment.retryCount >= payment.maxRetries) {
    return next(
      new AppError(`Maximum retry attempts (${payment.maxRetries}) exceeded`, 400)
    );
  }

  payment.status = 'Processing';
  payment.retryCount += 1;
  payment.failureReason = null;

  await payment.save();

  res.status(200).json({
    success: true,
    message: 'Payment retry initiated',
    data: payment,
  });
});
