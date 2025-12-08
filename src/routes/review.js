import express from "express";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  authorizeRoles,
  isAdmin,
  isApprover,
} from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { reviewValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.get("/:hotelId/reviews", reviewController.getHotelReviews);

router.get("/review/:id", reviewController.getReview);

// Protected routes
router.post(
  "/",
  authenticate,
  validateRequest(reviewValidations.create),
  reviewController.createReview
);

router.put(
  "/:id",
  authenticate,
  validateRequest(reviewValidations.update),
  reviewController.updateReview
);

router.delete("/:id", authenticate, reviewController.deleteReview);

router.post("/:id/helpful", authenticate, reviewController.markHelpful);

router.post(
  "/:id/not-helpful",
  authenticate,
  reviewController.markNotHelpful
);

router.get("/user/:userId/reviews", reviewController.getUserReviews);

// Moderator routes
router.get(
  "/moderator/pending",
  authenticate,
  isApprover,
  reviewController.getPendingReviews
);

router.put(
  "/:id/approve",
  authenticate,
  isApprover,
  reviewController.approveReview
);

router.put(
  "/:id/reject",
  authenticate,
  isApprover,
  reviewController.rejectReview
);

export default router;
