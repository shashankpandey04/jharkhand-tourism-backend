import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";

// Create review
export const createReview = catchAsyncErrors(async (req, res, next) => {
  const { title, content, rating, hotel, visitDate } = req.body;

  // Check if hotel exists
  const hotelExists = await Hotel.findById(hotel);
  if (!hotelExists) {
    return next(new AppError("Hotel not found", 404));
  }

  // Check if user already reviewed this hotel
  const existingReview = await Review.findOne({
    author: req.user.id,
    hotel,
  });

  if (existingReview) {
    return next(
      new AppError(
        "You have already reviewed this hotel. You can only have one review per hotel.",
        400
      )
    );
  }

  const review = await Review.create({
    title,
    content,
    rating,
    author: req.user.id,
    hotel,
    visitDate,
    status: "pending", // Requires moderation
  });

  res.status(201).json({
    success: true,
    message: "Review submitted successfully. Pending moderation.",
    review,
  });
});

// Get reviews for a hotel
export const getHotelReviews = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  const query = {
    hotel: id,
    status: "approved",
    deletedAt: null,
  };

  const reviews = await Review.find(query)
    .populate("author", "name avatar")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ [sortBy]: -1 });

  const total = await Review.countDocuments(query);

  // Calculate rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: { hotel: require("mongoose").Types.ObjectId(id) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    reviews,
    totalReviews: total,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    },
    ratingDistribution,
  });
});

// Get single review
export const getReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate("author", "name avatar email")
    .populate("hotel", "name location");

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    success: true,
    review,
  });
});

// Update review (author only)
export const updateReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, rating, visitDate } = req.body;

  let review = await Review.findById(id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.author.toString() !== req.user.id) {
    return next(
      new AppError("You don't have permission to update this review", 403)
    );
  }

  // Prevent update if approved (except by admin)
  if (review.status === "approved" && req.user.role !== "admin") {
    return next(
      new AppError("Cannot update approved reviews", 400)
    );
  }

  const updateData = {
    ...(title && { title }),
    ...(content && { content }),
    ...(rating && { rating }),
    ...(visitDate && { visitDate }),
  };

  review = await Review.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});

// Delete review (author or admin)
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  if (review.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete this review", 403)
    );
  }

  await Review.findByIdAndUpdate(id, { deletedAt: new Date() });

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// Mark review as helpful
export const markHelpful = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findByIdAndUpdate(
    id,
    { $inc: { helpful: 1 } },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Review marked as helpful",
    helpfulCount: review.helpful,
  });
});

// Mark review as not helpful
export const markNotHelpful = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findByIdAndUpdate(
    id,
    { $inc: { notHelpful: 1 } },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Review marked as not helpful",
    notHelpfulCount: review.notHelpful,
  });
});

// Get pending reviews (moderator)
export const getPendingReviews = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.find({
    status: "pending",
    deletedAt: null,
  })
    .populate("author", "name email avatar")
    .populate("hotel", "name location")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: 1 });

  const total = await Review.countDocuments({
    status: "pending",
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Approve review (moderator)
export const approveReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  review.status = "approved";
  review.verified = true;
  await review.save();

  // Update hotel rating
  const hotelReviews = await Review.find({
    hotel: review.hotel,
    status: "approved",
  });

  const avgRating =
    hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length;

  await Hotel.findByIdAndUpdate(review.hotel, {
    "rating.average": Math.round(avgRating * 10) / 10,
    "rating.count": hotelReviews.length,
  });

  res.status(200).json({
    success: true,
    message: "Review approved successfully",
    review,
  });
});

// Reject review (moderator)
export const rejectReview = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const review = await Review.findByIdAndUpdate(
    id,
    {
      status: "rejected",
      moderationNotes: reason,
    },
    { new: true }
  );

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Review rejected",
    review,
  });
});

// Get user reviews
export const getUserReviews = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.find({
    author: userId,
    status: "approved",
    deletedAt: null,
  })
    .populate("hotel", "name location images")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments({
    author: userId,
    status: "approved",
  });

  res.status(200).json({
    success: true,
    reviews,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});
