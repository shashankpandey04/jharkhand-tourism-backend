import express from "express";
import * as blogController from "../controllers/blog.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  authorizeRoles,
  isAdmin,
  isApprover,
} from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { blogValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.get("/", blogController.getAllBlogs);

router.get("/featured", blogController.getFeaturedBlogs);

router.get("/:identifier", blogController.getBlog);

// Protected routes
router.post(
  "/",
  authenticate,
  authorizeRoles("contributor", "moderator", "admin"),
  validateRequest(blogValidations.create),
  blogController.createBlog
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("contributor", "moderator", "admin"),
  validateRequest(blogValidations.update),
  blogController.updateBlog
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("contributor", "moderator", "admin"),
  blogController.deleteBlog
);

router.post(
  "/:id/submit",
  authenticate,
  authorizeRoles("contributor", "moderator", "admin"),
  blogController.submitBlogForApproval
);

router.post(
  "/:id/like",
  authenticate,
  blogController.likeBlog
);

router.post(
  "/:id/upload-image",
  authenticate,
  authorizeRoles("contributor", "moderator", "admin"),
  blogController.uploadBlogImage
);

router.get("/user/:userId/blogs", blogController.getUserBlogs);

// Moderator routes
router.get(
  "/moderator/pending",
  authenticate,
  isApprover,
  blogController.getPendingBlogs
);

router.put(
  "/:id/approve",
  authenticate,
  isApprover,
  blogController.approveBlog
);

router.put(
  "/:id/reject",
  authenticate,
  isApprover,
  blogController.rejectBlog
);

export default router;
