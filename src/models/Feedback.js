import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },

    phone: String,

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      minlength: [5, "Subject must be at least 5 characters"],
      maxlength: [100, "Subject cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      minlength: [20, "Message must be at least 20 characters"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },

    category: {
      type: String,
      enum: ["bug", "suggestion", "complaint", "partnership", "other"],
      default: "other",
    },

    attachments: [
      {
        url: String,
        publicId: String,
        fileName: String,
      },
    ],

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },

    status: {
      type: String,
      enum: ["new", "in-progress", "resolved", "closed"],
      default: "new",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    responses: [
      {
        responder: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    internalNotes: String,

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for common queries
feedbackSchema.index({ email: 1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ user: 1 });

export default mongoose.model("Feedback", feedbackSchema);
