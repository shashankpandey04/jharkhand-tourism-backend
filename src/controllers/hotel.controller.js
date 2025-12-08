import Hotel from "../models/Hotel.js";
import Review from "../models/Review.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";
import multer from "multer";

// Create new hotel (hotel_owner)
export const createHotel = catchAsyncErrors(async (req, res, next) => {
  const { name, description, location, pricePerNight, amenities, phone, email } =
    req.body;

  const hotel = await Hotel.create({
    name,
    description,
    location,
    pricePerNight,
    amenities: amenities || [],
    phone,
    email,
    owner: req.user.id,
    status: "pending", // requires admin approval
  });

  res.status(201).json({
    success: true,
    message: "Hotel created successfully. Awaiting admin approval.",
    hotel,
  });
});

// Get all hotels with filters
export const getAllHotels = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    city,
    minPrice,
    maxPrice,
    rating,
    amenities,
    search,
    isFeatured,
  } = req.query;

  const query = { status: "approved", deletedAt: null };

  if (city) {
    query["location.city"] = { $regex: city, $options: "i" };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (minPrice || maxPrice) {
    query.pricePerNight = {};
    if (minPrice) query.pricePerNight.$gte = Number(minPrice);
    if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
  }

  if (rating) {
    query["rating.average"] = { $gte: Number(rating) };
  }

  if (amenities) {
    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : [amenities];
    query.amenities = { $in: amenitiesArray };
  }

  if (isFeatured === "true") {
    query.isFeatured = true;
  }

  const skip = (page - 1) * limit;

  const hotels = await Hotel.find(query)
    .populate("owner", "name email phone avatar")
    .populate("reviews")
    .limit(limit * 1)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Hotel.countDocuments(query);

  res.status(200).json({
    success: true,
    hotels,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get hotel by ID
export const getHotelById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id)
    .populate("owner", "name email phone avatar")
    .populate({
      path: "reviews",
      populate: { path: "author", select: "name avatar" },
    });

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  // Update view count
  await Hotel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  res.status(200).json({
    success: true,
    hotel,
  });
});

// Update hotel (owner only)
export const updateHotel = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, pricePerNight, amenities, ...otherData } = req.body;

  const hotel = await Hotel.findById(id);

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  // Check if user is owner or admin
  if (hotel.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to update this hotel", 403)
    );
  }

  const updateData = {
    ...(name && { name }),
    ...(description && { description }),
    ...(pricePerNight && { pricePerNight }),
    ...(amenities && { amenities }),
    ...otherData,
  };

  const updatedHotel = await Hotel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Hotel updated successfully",
    hotel: updatedHotel,
  });
});

// Upload hotel images
export const uploadHotelImages = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files provided", 400));
  }

  const hotel = await Hotel.findById(id);

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  if (hotel.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to upload images", 403)
    );
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const result = await uploadImage(file.path, `hotels/${id}`);
    uploadedImages.push({
      url: result.secure_url,
      publicId: result.public_id,
      alt: req.body.alt || hotel.name,
    });
  }

  hotel.images.push(...uploadedImages);
  await hotel.save();

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    images: uploadedImages,
  });
});

// Delete hotel image
export const deleteHotelImage = catchAsyncErrors(async (req, res, next) => {
  const { id, imageId } = req.params;

  const hotel = await Hotel.findById(id);

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  const image = hotel.images.id(imageId);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  if (hotel.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete images", 403)
    );
  }

  // Delete from Cloudinary
  if (image.publicId) {
    await deleteImage(image.publicId);
  }

  hotel.images.pull({ _id: imageId });
  await hotel.save();

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

// Approve hotel (admin/moderator)
export const approveHotel = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { status: "approved" },
    { new: true }
  );

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Hotel approved successfully",
    hotel,
  });
});

// Reject hotel (admin/moderator)
export const rejectHotel = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const hotel = await Hotel.findByIdAndUpdate(
    id,
    { status: "rejected", rejectionReason: reason },
    { new: true }
  );

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Hotel rejected",
    hotel,
  });
});

// Get my hotels (hotel_owner)
export const getMyHotels = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { owner: req.user.id, deletedAt: null };

  if (status) {
    query.status = status;
  }

  const hotels = await Hotel.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Hotel.countDocuments(query);

  res.status(200).json({
    success: true,
    hotels,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Delete hotel (owner or admin)
export const deleteHotel = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id);

  if (!hotel) {
    return next(new AppError("Hotel not found", 404));
  }

  if (hotel.owner.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete this hotel", 403)
    );
  }

  await Hotel.findByIdAndUpdate(id, { deletedAt: new Date() });

  res.status(200).json({
    success: true,
    message: "Hotel deleted successfully",
  });
});

// Get featured hotels
export const getFeaturedHotels = catchAsyncErrors(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const hotels = await Hotel.find({
    isFeatured: true,
    status: "approved",
    deletedAt: null,
  })
    .limit(limit * 1)
    .populate("owner", "name email")
    .sort({ rating: -1 });

  res.status(200).json({
    success: true,
    hotels,
  });
});

// Search hotels by location (geospatial)
export const searchNearbyHotels = catchAsyncErrors(async (req, res, next) => {
  const { longitude, latitude, maxDistance = 10000 } = req.query;

  if (!longitude || !latitude) {
    return next(
      new AppError("Please provide longitude and latitude", 400)
    );
  }

  const hotels = await Hotel.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: Number(maxDistance),
      },
    },
    status: "approved",
    deletedAt: null,
  })
    .populate("owner", "name email phone")
    .select("-location.coordinates");

  res.status(200).json({
    success: true,
    count: hotels.length,
    hotels,
  });
});
