import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import reviewRoutes from "./routes/review.js";
import blogRoutes from "./routes/blog.js";
import placeRoutes from "./routes/place.js";
import feedbackRoutes from "./routes/feedback.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "🚀 Jharkhand Tourism Backend API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Jharkhand Tourism Backend API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
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

app.use(notFound);

app.use(errorHandler);

export default app;