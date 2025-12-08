import Place from "../models/Place.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";

// Create place
export const createPlace = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    description,
    city,
    district,
    category,
    entryFee,
    highlights,
    tags,
    accessibility,
  } = req.body;

  const place = await Place.create({
    name,
    description,
    location: {
      city,
      district,
    },
    category,
    entryFee: entryFee || 0,
    highlights: highlights || [],
    tags: tags || [],
    accessibility: accessibility || {},
    addedBy: req.user.id,
    verified: req.user.role === "admin",
  });

  res.status(201).json({
    success: true,
    message: "Place added successfully",
    place,
  });
});

// Get all places
export const getAllPlaces = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    city,
    category,
    search,
    verified,
    isFeatured,
  } = req.query;

  const query = { deletedAt: null };

  if (verified === "true") {
    query.verified = true;
  }

  if (city) {
    query["location.city"] = { $regex: city, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  if (isFeatured === "true") {
    query.isFeatured = true;
  }

  const places = await Place.find(query)
    .populate("addedBy", "name avatar email")
    .populate("nearbyPlaces", "name category")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Place.countDocuments(query);

  res.status(200).json({
    success: true,
    places,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get place by ID or slug
export const getPlace = catchAsyncErrors(async (req, res, next) => {
  const { identifier } = req.params;

  let place = await Place.findOne({
    $or: [{ _id: identifier }, { slug: identifier }],
  })
    .populate("addedBy", "name avatar email")
    .populate("nearbyPlaces", "name category images slug");

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  // Increment view count
  place = await Place.findByIdAndUpdate(
    place._id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate("addedBy", "name avatar email")
    .populate("nearbyPlaces", "name category images slug");

  res.status(200).json({
    success: true,
    place,
  });
});

// Update place (admin or creator)
export const updatePlace = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    entryFee,
    highlights,
    tags,
    accessibility,
  } = req.body;

  const place = await Place.findById(id);

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  if (place.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to update this place", 403)
    );
  }

  const updateData = {
    ...(name && { name }),
    ...(description && { description }),
    ...(category && { category }),
    ...(entryFee !== undefined && { entryFee }),
    ...(highlights && { highlights }),
    ...(tags && { tags }),
    ...(accessibility && { accessibility }),
  };

  const updatedPlace = await Place.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Place updated successfully",
    place: updatedPlace,
  });
});

// Upload place images
export const uploadPlaceImages = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files provided", 400));
  }

  const place = await Place.findById(id);

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  if (place.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to upload images", 403)
    );
  }

  const uploadedImages = [];

  for (const file of req.files) {
    const result = await uploadImage(file.path, `places/${id}`);
    uploadedImages.push({
      url: result.secure_url,
      publicId: result.public_id,
      alt: req.body.alt || place.name,
    });
  }

  place.images.push(...uploadedImages);
  await place.save();

  res.status(200).json({
    success: true,
    message: "Images uploaded successfully",
    images: uploadedImages,
  });
});

// Delete place image
export const deletePlaceImage = catchAsyncErrors(async (req, res, next) => {
  const { id, imageId } = req.params;

  const place = await Place.findById(id);

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  const image = place.images.id(imageId);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  if (place.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete images", 403)
    );
  }

  if (image.publicId) {
    await deleteImage(image.publicId);
  }

  place.images.pull({ _id: imageId });
  await place.save();

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});

// Delete place (admin only)
export const deletePlace = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const place = await Place.findById(id);

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  if (place.addedBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete this place", 403)
    );
  }

  await Place.findByIdAndUpdate(id, { deletedAt: new Date() });

  res.status(200).json({
    success: true,
    message: "Place deleted successfully",
  });
});

// Verify place (admin)
export const verifyPlace = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const place = await Place.findByIdAndUpdate(id, { verified: true }, { new: true });

  if (!place) {
    return next(new AppError("Place not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Place verified successfully",
    place,
  });
});

// Get places by city
export const getPlacesByCity = catchAsyncErrors(async (req, res, next) => {
  const { city } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const places = await Place.find({
    "location.city": { $regex: city, $options: "i" },
    deletedAt: null,
  })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate("addedBy", "name avatar")
    .sort({ createdAt: -1 });

  const total = await Place.countDocuments({
    "location.city": { $regex: city, $options: "i" },
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    places,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get featured places
export const getFeaturedPlaces = catchAsyncErrors(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const places = await Place.find({
    isFeatured: true,
    verified: true,
    deletedAt: null,
  })
    .limit(limit * 1)
    .populate("addedBy", "name avatar")
    .sort({ rating: -1 });

  res.status(200).json({
    success: true,
    places,
  });
});

// Search nearby places (geospatial)
export const searchNearbyPlaces = catchAsyncErrors(async (req, res, next) => {
  const { longitude, latitude, maxDistance = 10000 } = req.query;

  if (!longitude || !latitude) {
    return next(
      new AppError("Please provide longitude and latitude", 400)
    );
  }

  const places = await Place.find({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        $maxDistance: Number(maxDistance),
      },
    },
    verified: true,
    deletedAt: null,
  })
    .populate("addedBy", "name avatar")
    .select("-location.coordinates");

  res.status(200).json({
    success: true,
    count: places.length,
    places,
  });
});
