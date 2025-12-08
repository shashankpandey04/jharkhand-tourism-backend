import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/auth.js";
import hotelRoutes from "./routes/hotel.js";
import reviewRoutes from "./routes/review.js";
import blogRoutes from "./routes/blog.js";
import placeRoutes from "./routes/place.js";
import feedbackRoutes from "./routes/feedback.js";
import bookingRoutes from "./routes/booking.js";
import paymentRoutes from "./routes/payment.js";
import packageRoutes from "./routes/package.js";
import roomRoutes from "./routes/room.js";

// Import middleware
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 Jharkhand Tourism Backend API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/packages", packageRoutes);

// API Documentation
app.get("/api", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Jharkhand Tourism Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      hotels: "/api/hotels",
      rooms: "/api/rooms",
      bookings: "/api/bookings",
      payments: "/api/payments",
      packages: "/api/packages",
      reviews: "/api/reviews",
      blogs: "/api/blogs",
      places: "/api/places",
      feedback: "/api/feedback",
    },
    documentation: {
      swagger: "/api/docs",
      postman: "https://www.postman.com/",
    },
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;