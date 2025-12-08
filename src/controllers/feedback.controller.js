import Feedback from "../models/Feedback.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";

// Create feedback
export const createFeedback = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, subject, message, category, rating } = req.body;

  const feedback = await Feedback.create({
    name,
    email: email.toLowerCase(),
    phone,
    subject,
    message,
    category,
    rating,
    user: req.user?.id || null,
  });

  res.status(201).json({
    success: true,
    message: "Thank you for your feedback!",
    feedback,
  });
});

// Get all feedback (admin only)
export const getAllFeedback = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, status, category, priority } = req.query;

  const query = { deletedAt: null };

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (priority) {
    query.priority = priority;
  }

  const feedback = await Feedback.find(query)
    .populate("user", "name email avatar")
    .populate("assignedTo", "name email avatar")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Feedback.countDocuments(query);

  res.status(200).json({
    success: true,
    feedback,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get feedback by ID
export const getFeedback = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const feedback = await Feedback.findById(id)
    .populate("user", "name email avatar")
    .populate("assignedTo", "name email avatar")
    .populate("responses.responder", "name email avatar");

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    feedback,
  });
});

// Update feedback status (admin/moderator)
export const updateFeedbackStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  const validStatuses = ["new", "in-progress", "resolved", "closed"];
  const validPriorities = ["low", "medium", "high", "critical"];

  if (status && !validStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  if (priority && !validPriorities.includes(priority)) {
    return next(new AppError("Invalid priority", 400));
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;

  const feedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true })
    .populate("assignedTo", "name email avatar");

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Feedback updated successfully",
    feedback,
  });
});

// Assign feedback (admin)
export const assignFeedback = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { assignedTo },
    { new: true }
  ).populate("assignedTo", "name email avatar");

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Feedback assigned successfully",
    feedback,
  });
});

// Add response to feedback
export const addResponse = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return next(new AppError("Response message is required", 400));
  }

  const feedback = await Feedback.findById(id);

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  feedback.responses.push({
    responder: req.user.id,
    message,
  });

  await feedback.save();

  res.status(200).json({
    success: true,
    message: "Response added successfully",
    feedback,
  });
});

// Add internal notes
export const addInternalNotes = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) {
    return next(new AppError("Notes are required", 400));
  }

  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { internalNotes: notes },
    { new: true }
  );

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Notes added successfully",
    feedback,
  });
});

// Get feedback statistics (admin)
export const getFeedbackStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Feedback.aggregate([
    {
      $facet: {
        byStatus: [
          { $match: { deletedAt: null } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        byCategory: [
          { $match: { deletedAt: null } },
          { $group: { _id: "$category", count: { $sum: 1 } } },
        ],
        byPriority: [
          { $match: { deletedAt: null } },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ],
        avgRating: [
          { $match: { rating: { $exists: true }, deletedAt: null } },
          { $group: { _id: null, average: { $avg: "$rating" } } },
        ],
        total: [
          { $match: { deletedAt: null } },
          { $count: "total" },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    stats: stats[0],
  });
});

// Delete feedback (admin)
export const deleteFeedback = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const feedback = await Feedback.findByIdAndUpdate(
    id,
    { deletedAt: new Date() },
    { new: true }
  );

  if (!feedback) {
    return next(new AppError("Feedback not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Feedback deleted successfully",
  });
});

// Get user feedback
export const getUserFeedback = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const feedback = await Feedback.find({
    email: req.user.email,
    deletedAt: null,
  })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Feedback.countDocuments({
    email: req.user.email,
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    feedback,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});
