import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    rooms: [
      {
        room: {
          type: mongoose.Schema.ObjectId,
          ref: 'Room',
          required: true,
        },
        roomType: String,
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        basePrice: Number,
        finalPrice: Number,
      },
    ],
    guestDetails: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      specialRequests: String,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    numberOfNights: {
      type: Number,
      required: true,
    },
    numberOfGuests: {
      type: Number,
      required: true,
    },
    pricing: {
      roomCharges: {
        type: Number,
        required: true,
      },
      taxesAndFees: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      priceBreakdown: {
        perNightPrice: Number,
        numberOfNights: Number,
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled', 'No-Show'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partial', 'Paid', 'Refunded'],
      default: 'Unpaid',
    },
    payment: {
      type: mongoose.Schema.ObjectId,
      ref: 'Payment',
    },
    cancellation: {
      reason: String,
      cancelledAt: Date,
      cancelledBy: {
        type: String,
        enum: ['User', 'Admin'],
      },
      refundAmount: Number,
      refundStatus: {
        type: String,
        enum: ['Pending', 'Processed', 'Failed'],
      },
    },
    confirmationNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    cancellationPolicy: {
      freeCancel: Number, // days before check-in
      description: String,
    },
    notes: String,
    isModified: {
      type: Boolean,
      default: false,
    },
    modifications: [
      {
        modifiedAt: Date,
        modifiedBy: mongoose.Schema.ObjectId,
        changes: String,
      },
    ],
    deletedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate booking ID
bookingSchema.pre('save', async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `BK${Date.now()}${count}`;
  }

  if (this.checkInDate && this.checkOutDate) {
    this.numberOfNights = Math.ceil(
      (this.checkOutDate - this.checkInDate) / (1000 * 60 * 60 * 24)
    );
  }

  next();
});

// Calculate confirmation number
bookingSchema.methods.generateConfirmationNumber = function () {
  return `CONF${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
};

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const daysUntilCheckIn = Math.ceil(
    (this.checkInDate - now) / (1000 * 60 * 60 * 24)
  );
  return daysUntilCheckIn >= this.cancellationPolicy.freeCancel;
};

// Calculate refund amount
bookingSchema.methods.calculateRefund = function () {
  if (!this.canBeCancelled()) {
    return 0;
  }
  return this.pricing.totalPrice;
};

// Indexes
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ confirmationNumber: 1 });
bookingSchema.index({ 'guestDetails.email': 1 });

export default mongoose.model('Booking', bookingSchema);
