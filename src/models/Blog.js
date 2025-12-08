import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Blog content is required"],
      minlength: [100, "Content must be at least 100 characters"],
    },

    excerpt: {
      type: String,
      maxlength: 500,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Travel Guide",
        "Local Culture",
        "Adventure",
        "Nature",
        "Food",
        "History",
        "Events",
        "Tips",
        "Other",
      ],
      default: "Travel Guide",
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    featuredImage: {
      url: String,
      publicId: String,
      alt: String,
    },

    images: [
      {
        url: String,
        publicId: String,
        alt: String,
        caption: String,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "published", "rejected"],
      default: "draft",
      index: true,
    },

    rejectionReason: String,

    viewCount: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    relatedPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Place",
      },
    ],

    publishedAt: Date,

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    readTime: {
      type: Number, // in minutes
      default: 5,
    },

    seoKeywords: [String],

    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug from title before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Calculate read time (roughly 200 words per minute)
  if (this.isModified("content")) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  next();
});

export default mongoose.model("Blog", blogSchema);
