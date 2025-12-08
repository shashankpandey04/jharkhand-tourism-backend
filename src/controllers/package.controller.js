import Package from '../models/Package.js';
import Itinerary from '../models/Itinerary.js';
import { catchAsyncErrors } from '../middleware/errorHandler.js';
import AppError from '../middleware/errorHandler.js';

// Create package
export const createPackage = catchAsyncErrors(async (req, res, next) => {
  const {
    title,
    description,
    shortDescription,
    category,
    duration,
    itineraryId,
    location,
    pricing,
    groupSize,
    highlights,
    inclusions,
    exclusions,
    accommodations,
    activities,
    meals,
    transportation,
    guide,
    cancellationPolicy,
    bestTimeToVisit,
    idealFor,
    difficulty,
  } = req.body;

  // Verify itinerary exists
  const itinerary = await Itinerary.findById(itineraryId);
  if (!itinerary) {
    return next(new AppError('Itinerary not found', 404));
  }

  const packageData = new Package({
    title,
    description,
    shortDescription,
    category,
    duration,
    itinerary: itineraryId,
    location,
    pricing,
    groupSize,
    highlights,
    inclusions,
    exclusions,
    accommodations,
    activities,
    meals,
    transportation,
    guide,
    cancellationPolicy,
    bestTimeToVisit,
    idealFor,
    difficulty,
    createdBy: req.user.id,
  });

  await packageData.save();

  res.status(201).json({
    success: true,
    message: 'Package created successfully',
    data: packageData,
  });
});

// Get all packages
export const getAllPackages = catchAsyncErrors(async (req, res, next) => {
  const { category, difficulty, minPrice, maxPrice, location, featured } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  let query = { status: 'Active', deletedAt: null };

  if (category) {
    query.category = category;
  }
  if (difficulty) {
    query.difficulty = difficulty;
  }
  if (location) {
    query['location.cities'] = { $in: [location] };
  }
  if (featured === 'true') {
    query.isFeatured = true;
  }

  if (minPrice || maxPrice) {
    query['pricing.finalPrice'] = {};
    if (minPrice) query['pricing.finalPrice'].$gte = parseInt(minPrice);
    if (maxPrice) query['pricing.finalPrice'].$lte = parseInt(maxPrice);
  }

  const skip = (page - 1) * limit;

  const packages = await Package.find(query)
    .populate('itinerary', 'title duration')
    .skip(skip)
    .limit(limit)
    .sort('-createdAt');

  const total = await Package.countDocuments(query);

  res.status(200).json({
    success: true,
    count: packages.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: packages,
  });
});

// Get package by ID or slug
export const getPackage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let packageData = await Package.findById(id)
    .populate('itinerary')
    .populate('accommodations.hotel', 'name city rating')
    .populate('activities.place', 'name location category')
    .populate('reviews');

  if (!packageData) {
    packageData = await Package.findOne({ slug: id })
      .populate('itinerary')
      .populate('accommodations.hotel', 'name city rating')
      .populate('activities.place', 'name location category')
      .populate('reviews');
  }

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  // Increment view count
  packageData.viewCount += 1;
  await packageData.save();

  res.status(200).json({
    success: true,
    data: packageData,
  });
});

// Update package
export const updatePackage = catchAsyncErrors(async (req, res, next) => {
  let packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  if (packageData.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized to update this package', 403));
  }

  packageData = await Package.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Package updated successfully',
    data: packageData,
  });
});

// Delete package
export const deletePackage = catchAsyncErrors(async (req, res, next) => {
  let packageData = await Package.findById(req.params.id);

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  if (packageData.createdBy.toString() !== req.user.id && req.user.role !== 'Admin') {
    return next(new AppError('Not authorized', 403));
  }

  packageData.deletedAt = new Date();
  await packageData.save();

  res.status(200).json({
    success: true,
    message: 'Package deleted successfully',
  });
});

// Get featured packages
export const getFeaturedPackages = catchAsyncErrors(async (req, res, next) => {
  const packages = await Package.find({ isFeatured: true, status: 'Active', deletedAt: null })
    .populate('itinerary', 'title duration')
    .limit(6)
    .sort('-bookingsCount');

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

// Get popular packages
export const getPopularPackages = catchAsyncErrors(async (req, res, next) => {
  const packages = await Package.find({ isPopular: true, status: 'Active', deletedAt: null })
    .populate('itinerary', 'title duration')
    .limit(10)
    .sort('-ratings.average');

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

// Search packages by location
export const searchPackagesByLocation = catchAsyncErrors(async (req, res, next) => {
  const { city } = req.params;

  const packages = await Package.find({
    'location.cities': { $in: [city] },
    status: 'Active',
    deletedAt: null,
  })
    .populate('itinerary', 'title duration')
    .sort('-ratings.average');

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

// Search packages by category
export const searchPackagesByCategory = catchAsyncErrors(async (req, res, next) => {
  const { category } = req.params;

  const packages = await Package.find({ category, status: 'Active', deletedAt: null })
    .populate('itinerary', 'title duration')
    .sort('-bookingsCount');

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});

// Get package statistics
export const getPackageStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Package.aggregate([
    { $match: { status: 'Active', deletedAt: null } },
    {
      $group: {
        _id: null,
        totalPackages: { $sum: 1 },
        totalBookings: { $sum: '$bookingsCount' },
        averageRating: { $avg: '$ratings.average' },
        totalReviews: { $sum: '$ratings.count' },
      },
    },
  ]);

  const byCategory = await Package.aggregate([
    { $match: { status: 'Active', deletedAt: null } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        bookings: { $sum: '$bookingsCount' },
        avgRating: { $avg: '$ratings.average' },
      },
    },
  ]);

  const topPackages = await Package.find({ status: 'Active', deletedAt: null })
    .populate('itinerary', 'title')
    .sort('-bookingsCount')
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      overall: stats[0] || {},
      byCategory,
      topPackages,
    },
  });
});

// Add review to package
export const addPackageReview = catchAsyncErrors(async (req, res, next) => {
  const { packageId } = req.params;
  const { rating, review } = req.body;

  const packageData = await Package.findById(packageId);

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }

  // In real implementation, create Review record
  // For now, just update package rating
  const currentTotal = packageData.ratings.average * packageData.ratings.count;
  packageData.ratings.count += 1;
  packageData.ratings.average =
    (currentTotal + rating) / packageData.ratings.count;

  await packageData.save();

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: packageData,
  });
});

// Get availability
export const getPackageAvailability = catchAsyncErrors(async (req, res, next) => {
  const { packageId } = req.params;
  const { startDate, endDate } = req.query;

  const packageData = await Package.findById(packageId);

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  const availability = packageData.availability.filter((av) => {
    const avStart = new Date(av.startDate);
    const avEnd = new Date(av.endDate);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return avStart <= end && avEnd >= start;
  });

  res.status(200).json({
    success: true,
    data: {
      package: {
        id: packageData._id,
        title: packageData.title,
        duration: packageData.displayDuration,
      },
      availability,
    },
  });
});

// Book package (simplified)
export const bookPackage = catchAsyncErrors(async (req, res, next) => {
  const { packageId, startDate, numberOfPeople } = req.body;

  const packageData = await Package.findById(packageId);

  if (!packageData) {
    return next(new AppError('Package not found', 404));
  }

  if (numberOfPeople < packageData.groupSize.min) {
    return next(
      new AppError(`Minimum group size is ${packageData.groupSize.min}`, 400)
    );
  }

  if (numberOfPeople > packageData.groupSize.max) {
    return next(
      new AppError(`Maximum group size is ${packageData.groupSize.max}`, 400)
    );
  }

  // Calculate discounted price
  let finalPrice = packageData.pricing.finalPrice * numberOfPeople;
  const groupDiscount = packageData.getGroupDiscount(numberOfPeople);

  if (groupDiscount > packageData.pricing.discountPercentage) {
    finalPrice = finalPrice * (1 - (groupDiscount - packageData.pricing.discountPercentage) / 100);
  }

  // In real implementation, create booking record
  // For now, return booking details
  res.status(201).json({
    success: true,
    message: 'Package booking initiated',
    data: {
      package: {
        title: packageData.title,
        duration: packageData.displayDuration,
      },
      booking: {
        startDate,
        numberOfPeople,
        pricePerPerson: packageData.pricing.finalPrice,
        groupDiscount,
        totalPrice: finalPrice,
      },
    },
  });
});
