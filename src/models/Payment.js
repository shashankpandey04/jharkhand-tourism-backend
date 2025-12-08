import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Cash'],
      required: true,
    },
    paymentDetails: {
      cardLast4: String,
      cardBrand: String, // Visa, Mastercard, Amex
      upiId: String,
      bankName: String,
      walletName: String,
    },
    status: {
      type: String,
      enum: ['Initiated', 'Processing', 'Success', 'Failed', 'Cancelled'],
      default: 'Initiated',
    },
    gatewayResponse: {
      gateway: String, // Razorpay, Stripe, PayPal
      gatewayTransactionId: String,
      gatewayReferenceId: String,
      response: mongoose.Schema.Types.Mixed,
    },
    refund: {
      refundId: String,
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ['Not Initiated', 'Pending', 'Processed', 'Failed', 'Partial'],
        default: 'Not Initiated',
      },
      refundReason: String,
      refundInitiatedAt: Date,
      refundCompletedAt: Date,
    },
    invoiceUrl: String,
    receiptUrl: String,
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
    failureReason: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate transaction ID
paymentSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.transactionId = `TXN${Date.now()}${count}`;
  }
  next();
});

// Calculate refund eligibility
paymentSchema.methods.canBeRefunded = function () {
  return this.status === 'Success' && this.refund.refundStatus === 'Not Initiated';
};

// Process refund
paymentSchema.methods.initiateRefund = async function (amount, reason) {
  if (!this.canBeRefunded()) {
    throw new Error('Payment cannot be refunded');
  }

  this.refund.refundAmount = amount || this.amount;
  this.refund.refundReason = reason;
  this.refund.refundStatus = 'Pending';
  this.refund.refundInitiatedAt = new Date();
  this.refund.refundId = `REF${Date.now()}`;

  return this.save();
};

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ 'gatewayResponse.gatewayTransactionId': 1 });
paymentSchema.index({ createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
