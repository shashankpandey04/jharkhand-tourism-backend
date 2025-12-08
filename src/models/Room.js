import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Twin', 'Suite', 'Deluxe', 'Presidential'],
      required: true,
    },
    capacity: {
      adults: {
        type: Number,
        required: true,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerAdditionalGuest: {
      type: Number,
      default: 0,
    },
    totalRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    availableRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: [
      {
        type: String,
        enum: [
          'AC',
          'WiFi',
          'TV',
          'Minibar',
          'Safe',
          'Bathrobe',
          'Slippers',
          'Gym',
          'Spa',
          'Balcony',
          'Work Desk',
          'Iron',
          'Hairdryer',
        ],
      },
    ],
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    description: String,
    features: [String],
    bedType: {
      type: String,
      enum: ['Single', 'Double', 'Twin', 'Queen', 'King'],
    },
    size: {
      type: Number, // in sqft
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    discount: {
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      validFrom: Date,
      validTo: Date,
    },
    cancellationPolicy: {
      freeCancel: {
        type: Number, // days before check-in
        default: 0,
      },
      description: String,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Index for faster queries
roomSchema.index({ hotel: 1, isActive: 1 });
roomSchema.index({ hotel: 1, roomType: 1 });
roomSchema.index({ 'discount.validFrom': 1, 'discount.validTo': 1 });

// Virtual for discounted price
roomSchema.virtual('discountedPrice').get(function () {
  const now = new Date();
  if (
    this.discount.percentage > 0 &&
    this.discount.validFrom &&
    this.discount.validTo &&
    now >= this.discount.validFrom &&
    now <= this.discount.validTo
  ) {
    return this.basePrice * (1 - this.discount.percentage / 100);
  }
  return this.basePrice;
});

// Pre-save hook to validate availability
roomSchema.pre('save', function (next) {
  if (this.availableRooms > this.totalRooms) {
    next(new Error('Available rooms cannot exceed total rooms'));
  }
  next();
});

export default mongoose.model('Room', roomSchema);
