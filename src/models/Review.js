import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    content: {
      type: String,
      required: [true, "Review content is required"],
      minlength: [20, "Content must be at least 20 characters"],
      maxlength: [1000, "Content cannot exceed 1000 characters"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "Hotel is required"],
      index: true,
    },

    category: {
      type: String,
      enum: ["cleanliness", "comfort", "service", "value", "location", "food"],
    },

    verified: {
      type: Boolean,
      default: false,
    },

    helpful: {
      type: Number,
      default: 0,
    },

    notHelpful: {
      type: Number,
      default: 0,
    },

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "hidden"],
      default: "pending",
      index: true,
    },

    moderationNotes: String,

    visitDate: Date,

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound index for user and hotel
reviewSchema.index({ author: 1, hotel: 1 });

// Virtual for helpful percentage
reviewSchema.virtual("helpfulPercentage").get(function () {
  const total = this.helpful + this.notHelpful;
  return total > 0 ? Math.round((this.helpful / total) * 100) : 0;
});

export default mongoose.model("Review", reviewSchema);
