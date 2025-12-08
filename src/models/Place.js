import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [50, "Description must be at least 50 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    location: {
      address: String,
      city: {
        type: String,
        required: true,
        index: true,
      },
      district: String,
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

    category: {
      type: String,
      enum: [
        "Temple",
        "Waterfall",
        "National Park",
        "Wildlife",
        "Museum",
        "Historical",
        "Adventure",
        "Beach",
        "Hill Station",
        "Other",
      ],
      required: true,
      index: true,
    },

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

    bestTimeToVisit: {
      startMonth: {
        type: Number,
        min: 1,
        max: 12,
      },
      endMonth: {
        type: Number,
        min: 1,
        max: 12,
      },
      description: String,
    },

    entryFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    entryFeeDescription: String,

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

    timings: {
      opening: String,
      closing: String,
      note: String,
    },

    nearbyPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
      },
    ],

    tags: [String],

    highlights: [String],

    accessibility: {
      wheelchair: Boolean,
      parking: Boolean,
      publicTransport: Boolean,
      guide: Boolean,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Create 2dsphere index
placeSchema.index({ "location.coordinates": "2dsphere" });

// Generate slug
placeSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

export default mongoose.model("Place", placeSchema);
