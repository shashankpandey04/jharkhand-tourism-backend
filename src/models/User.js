import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    avatar: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "hotel_owner", "contributor", "moderator", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
