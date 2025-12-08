import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: String,
    shortDescription: String,
    category: {
      type: String,
      enum: ['Adventure', 'Relaxation', 'Cultural', 'Family', 'Honeymoon', 'Wildlife', 'Heritage'],
      required: true,
    },
    duration: {
      days: {
        type: Number,
        required: true,
        min: 1,
      },
      nights: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    itinerary: {
      type: mongoose.Schema.ObjectId,
      ref: 'Itinerary',
      required: true,
    },
    location: {
      primary: String,
      cities: [String],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      originalPrice: Number,
      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      finalPrice: Number,
      pricePerPerson: Boolean,
      groupDiscounts: [
        {
          minPeople: Number,
          maxPeople: Number,
          discountPercentage: Number,
        },
      ],
    },
    groupSize: {
      min: {
        type: Number,
        default: 1,
      },
      max: {
        type: Number,
        required: true,
      },
    },
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    highlights: [String],
    inclusions: [String],
    exclusions: [String],
    accommodations: [
      {
        hotel: {
          type: mongoose.Schema.ObjectId,
          ref: 'Hotel',
        },
        nights: Number,
        roomType: String,
      },
    ],
    activities: [
      {
        name: String,
        included: Boolean,
        place: {
          type: mongoose.Schema.ObjectId,
          ref: 'Place',
        },
      },
    ],
    meals: {
      breakfast: Boolean,
      lunch: Boolean,
      dinner: Boolean,
    },
    transportation: {
      type: String,
      enum: ['Flight', 'Train', 'Bus', 'Car', 'Mixed'],
    },
    guide: {
      included: {
        type: Boolean,
        default: true,
      },
      language: [String],
      description: String,
    },
    cancellationPolicy: {
      freeCancel: {
        type: Number, // days before start
        default: 7,
      },
      description: String,
    },
    bestTimeToVisit: {
      startMonth: String,
      endMonth: String,
      reason: String,
    },
    idealFor: [String],
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging'],
      default: 'Easy',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Archived'],
      default: 'Active',
    },
    availability: [
      {
        startDate: Date,
        endDate: Date,
        seatsAvailable: Number,
        seatsBooked: Number,
      },
    ],
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
    reviews: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Review',
      },
    ],
    bookingsCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    faq: [
      {
        question: String,
        answer: String,
      },
    ],
    tags: [String],
    deletedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate slug
packageSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // Calculate final price
  if (this.pricing.basePrice) {
    const discount = this.pricing.discountPercentage || 0;
    this.pricing.finalPrice = this.pricing.basePrice * (1 - discount / 100);
  }

  next();
});

// Virtual for display duration
packageSchema.virtual('displayDuration').get(function () {
  return `${this.duration.days}D/${this.duration.nights}N`;
});

// Calculate discount amount
packageSchema.methods.getDiscountAmount = function () {
  if (this.pricing.originalPrice) {
    return this.pricing.originalPrice - this.pricing.finalPrice;
  }
  return this.pricing.basePrice * (this.pricing.discountPercentage / 100);
};

// Get applicable group discount
packageSchema.methods.getGroupDiscount = function (groupSize) {
  const discount = this.pricing.groupDiscounts.find(
    (d) => groupSize >= d.minPeople && groupSize <= d.maxPeople
  );
  return discount ? discount.discountPercentage : this.pricing.discountPercentage;
};

// Indexes
packageSchema.index({ slug: 1 });
packageSchema.index({ category: 1, status: 1 });
packageSchema.index({ isFeatured: 1, status: 1 });
packageSchema.index({ 'location.cities': 1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ viewCount: -1 });
packageSchema.index({ 'ratings.average': -1 });

export default mongoose.model('Package', packageSchema);
