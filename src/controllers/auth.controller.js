import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateTokens } from "../middleware/auth.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";

// Register new user
export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, confirmPassword, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(new AppError("Please provide all required fields", 400));
  }

  if (password !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError("Email already registered", 409));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "user",
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.email,
    user.role
  );

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Set access token in httpOnly cookie
  res.cookie("authToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Remove password from response
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: userResponse,
    token: accessToken,
  });
});

// Login user
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    return next(new AppError("Invalid email or password", 401));
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id,
    user.email,
    user.role
  );

  // Set cookies
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.cookie("authToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(200).json({
    success: true,
    message: "Login successful",
    user: userResponse,
    token: accessToken,
  });
});

// Logout user
export const logout = (req, res) => {
  res.clearCookie("authToken");
  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

// Get current user
export const getCurrentUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update profile
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, phone, avatar } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (avatar) updateData.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

// Change password
export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(
      new AppError("Please provide all required password fields", 400)
    );
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError("New passwords do not match", 400));
  }

  const user = await User.findById(req.user.id);

  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordMatched) {
    return next(new AppError("Old password is incorrect", 401));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// Request password reset
export const requestPasswordReset = catchAsyncErrors(
  async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a reset link will be sent",
      });
    }

    // In production, implement actual email sending
    // For now, generate a reset token (would be stored in DB with expiry)
    const resetToken = Math.random().toString(36).substring(2, 15);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to email",
      // In production, don't return the token
      resetToken, // for testing only
    });
  }
);

// Get all users (admin only)
export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, role, search } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("-password")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

// Update user role (admin only)
export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.body;
  const { userId } = req.params;

  const validRoles = ["user", "hotel_owner", "contributor", "moderator", "admin"];

  if (!validRoles.includes(role)) {
    return next(new AppError("Invalid role", 400));
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
    .select("-password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user,
  });
});

// Delete user (admin only)
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { deletedAt: new Date() },
    { new: true }
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// Verify email (would be called from email link)
export const verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.body;

  // In production, verify token from DB
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { isVerified: true },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});
