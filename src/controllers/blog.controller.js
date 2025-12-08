import Blog from "../models/Blog.js";
import Comment from "../models/Comment.js";
import { catchAsyncErrors, AppError } from "../middleware/errorHandler.js";
import { uploadImage, deleteImage } from "../config/cloudinary.js";

// Create blog
export const createBlog = catchAsyncErrors(async (req, res, next) => {
  const { title, content, excerpt, category, tags, relatedPlaces } = req.body;

  const blog = await Blog.create({
    title,
    content,
    excerpt: excerpt || content.substring(0, 500),
    category,
    tags: tags || [],
    author: req.user.id,
    relatedPlaces: relatedPlaces || [],
    status: "draft",
  });

  res.status(201).json({
    success: true,
    message: "Blog created as draft",
    blog,
  });
});

// Get all published blogs
export const getAllBlogs = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    category,
    search,
    sortBy = "createdAt",
    isFeatured,
  } = req.query;

  const query = {
    status: "published",
    deletedAt: null,
  };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  if (isFeatured === "true") {
    query.isFeatured = true;
  }

  const blogs = await Blog.find(query)
    .populate("author", "name avatar email")
    .populate("comments")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ [sortBy]: -1 });

  const total = await Blog.countDocuments(query);

  res.status(200).json({
    success: true,
    blogs,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get blog by ID or slug
export const getBlog = catchAsyncErrors(async (req, res, next) => {
  const { identifier } = req.params; // Can be ID or slug

  let blog = await Blog.findOne({
    $or: [{ _id: identifier }, { slug: identifier }],
  })
    .populate("author", "name avatar email")
    .populate({
      path: "comments",
      populate: { path: "author", select: "name avatar" },
    });

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  // Increment view count
  blog = await Blog.findByIdAndUpdate(
    blog._id,
    { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate("author", "name avatar email")
    .populate({
      path: "comments",
      populate: { path: "author", select: "name avatar" },
    });

  res.status(200).json({
    success: true,
    blog,
  });
});

// Update blog (author only)
export const updateBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, excerpt, category, tags, relatedPlaces } = req.body;

  let blog = await Blog.findById(id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to update this blog", 403)
    );
  }

  const updateData = {
    ...(title && { title }),
    ...(content && { content }),
    ...(excerpt && { excerpt }),
    ...(category && { category }),
    ...(tags && { tags }),
    ...(relatedPlaces && { relatedPlaces }),
  };

  blog = await Blog.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Blog updated successfully",
    blog,
  });
});

// Submit blog for approval
export const submitBlogForApproval = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to submit this blog", 403)
    );
  }

  blog.status = "pending";
  await blog.save();

  res.status(200).json({
    success: true,
    message: "Blog submitted for approval",
    blog,
  });
});

// Approve blog (moderator)
export const approveBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findByIdAndUpdate(
    id,
    {
      status: "published",
      publishedAt: new Date(),
    },
    { new: true }
  );

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Blog approved and published",
    blog,
  });
});

// Reject blog (moderator)
export const rejectBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const blog = await Blog.findByIdAndUpdate(
    id,
    {
      status: "rejected",
      rejectionReason: reason,
    },
    { new: true }
  );

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Blog rejected",
    blog,
  });
});

// Delete blog (author or admin)
export const deleteBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to delete this blog", 403)
    );
  }

  await Blog.findByIdAndUpdate(id, { deletedAt: new Date() });

  res.status(200).json({
    success: true,
    message: "Blog deleted successfully",
  });
});

// Like blog
export const likeBlog = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let blog = await Blog.findById(id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  const alreadyLiked = blog.likedBy.includes(req.user.id);

  if (alreadyLiked) {
    blog.likedBy.pull(req.user.id);
    blog.likes -= 1;
  } else {
    blog.likedBy.push(req.user.id);
    blog.likes += 1;
  }

  await blog.save();

  res.status(200).json({
    success: true,
    message: alreadyLiked ? "Like removed" : "Blog liked",
    likes: blog.likes,
  });
});

// Get user blogs
export const getUserBlogs = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const query = {
    author: userId,
    deletedAt: null,
  };

  if (status) {
    query.status = status;
  }

  // Only show published blogs if not the author
  if (req.user?.id !== userId) {
    query.status = "published";
  }

  const blogs = await Blog.find(query)
    .populate("author", "name avatar email")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Blog.countDocuments(query);

  res.status(200).json({
    success: true,
    blogs,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Get featured blogs
export const getFeaturedBlogs = catchAsyncErrors(async (req, res, next) => {
  const { limit = 6 } = req.query;

  const blogs = await Blog.find({
    isFeatured: true,
    status: "published",
    deletedAt: null,
  })
    .limit(limit * 1)
    .populate("author", "name avatar email")
    .sort({ publishedAt: -1 });

  res.status(200).json({
    success: true,
    blogs,
  });
});

// Get pending blogs (moderator)
export const getPendingBlogs = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const blogs = await Blog.find({
    status: "pending",
    deletedAt: null,
  })
    .populate("author", "name avatar email")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: 1 });

  const total = await Blog.countDocuments({
    status: "pending",
    deletedAt: null,
  });

  res.status(200).json({
    success: true,
    blogs,
    pagination: {
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

// Upload blog featured image
export const uploadBlogImage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!req.file) {
    return next(new AppError("No file provided", 400));
  }

  const blog = await Blog.findById(id);

  if (!blog) {
    return next(new AppError("Blog not found", 404));
  }

  if (blog.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You don't have permission to upload images", 403)
    );
  }

  const result = await uploadImage(req.file.path, `blogs/${id}`);

  blog.featuredImage = {
    url: result.secure_url,
    publicId: result.public_id,
    alt: req.body.alt || blog.title,
  };

  await blog.save();

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    image: blog.featuredImage,
  });
});
