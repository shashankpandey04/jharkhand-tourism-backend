import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema(
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
    location: {
      primary: String,
      cities: [String],
      state: String,
    },
    days: [
      {
        dayNumber: Number,
        title: String,
        description: String,
        activities: [
          {
            name: String,
            place: {
              type: mongoose.Schema.ObjectId,
              ref: 'Place',
            },
            time: String,
            duration: String,
            description: String,
            image: String,
          },
        ],
        accommodation: {
          hotel: {
            type: mongoose.Schema.ObjectId,
            ref: 'Hotel',
          },
          checkInTime: String,
          checkOutTime: String,
          roomType: String,
        },
        meals: {
          breakfast: Boolean,
          lunch: Boolean,
          dinner: Boolean,
          specialMenu: String,
        },
        transportation: String,
        notes: String,
      },
    ],
    inclusions: [String],
    exclusions: [String],
    highlights: [String],
    idealFor: [String], // Families, Couples, Solo, Adventure Seekers, etc.
    bestTimeToVisit: {
      startMonth: String,
      endMonth: String,
      reason: String,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Challenging'],
      default: 'Easy',
    },
    pricePerPerson: {
      type: Number,
      required: true,
      min: 0,
    },
    maxGroupSize: {
      type: Number,
      default: 20,
    },
    minGroupSize: {
      type: Number,
      default: 1,
    },
    images: [
      {
        url: String,
        publicId: String,
        caption: String,
      },
    ],
    faqs: [
      {
        question: String,
        answer: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    viewCount: {
      type: Number,
      default: 0,
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
    bookingsCount: {
      type: Number,
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Auto-generate slug
itinerarySchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

// Virtual for total price
itinerarySchema.virtual('totalDuration').get(function () {
  return `${this.duration.days}D/${this.duration.nights}N`;
});

// Indexes
itinerarySchema.index({ slug: 1 });
itinerarySchema.index({ status: 1, isFeatured: 1 });
itinerarySchema.index({ 'location.cities': 1 });
itinerarySchema.index({ difficulty: 1 });
itinerarySchema.index({ createdAt: -1 });
itinerarySchema.index({ viewCount: -1 });
itinerarySchema.index({ 'ratings.average': -1 });

export default mongoose.model('Itinerary', itinerarySchema);
