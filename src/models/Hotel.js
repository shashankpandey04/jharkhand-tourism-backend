import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      minlength: [3, "Hotel name must be at least 3 characters"],
      maxlength: [100, "Hotel name cannot exceed 100 characters"],
      index: true,
    },

    description: {
      type: String,
      required: [true, "Hotel description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hotel owner is required"],
      index: true,
    },

    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
        index: true,
      },
      state: {
        type: String,
        default: "Jharkhand",
      },
      pincode: String,
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
        },
      },
    },

    rating: {
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

    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
    },

    amenities: [
      {
        type: String,
        enum: [
          "WiFi",
          "Pool",
          "Gym",
          "Restaurant",
          "Parking",
          "AC",
          "TV",
          "Laundry",
          "Room Service",
          "Conference Room",
        ],
      },
    ],

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: String,
        alt: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    rooms: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },

    checkInTime: {
      type: String,
      default: "14:00",
    },

    checkOutTime: {
      type: String,
      default: "11:00",
    },

    policies: {
      cancellation: String,
      children: String,
      pets: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true,
    },

    rejectionReason: String,

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    phone: String,
    website: String,
    email: String,

    tags: [String],

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create 2dsphere index for geospatial queries
hotelSchema.index({ "location.coordinates": "2dsphere" });

// Virtual for review count
hotelSchema.virtual("reviewCount").get(function () {
  return this.reviews.length;
});

// Pre-save validation
hotelSchema.pre("save", function (next) {
  if (this.location.coordinates.coordinates) {
    const [lng, lat] = this.location.coordinates.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error("Invalid coordinates");
    }
  }
  next();
});

export default mongoose.model("Hotel", hotelSchema);
