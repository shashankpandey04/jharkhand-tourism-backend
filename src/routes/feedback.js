import express from "express";
import * as feedbackController from "../controllers/feedback.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  authorizeRoles,
  isAdmin,
  isApprover,
} from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { feedbackValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.post(
  "/",
  validateRequest(feedbackValidations.create),
  feedbackController.createFeedback
);

// Protected routes - User can view their own feedback
router.get(
  "/my-feedback",
  authenticate,
  feedbackController.getUserFeedback
);

// Admin/Moderator routes
router.get(
  "/",
  authenticate,
  isApprover,
  feedbackController.getAllFeedback
);

router.get("/:id", authenticate, isApprover, feedbackController.getFeedback);

router.put(
  "/:id/status",
  authenticate,
  isApprover,
  feedbackController.updateFeedbackStatus
);

router.put(
  "/:id/assign",
  authenticate,
  isAdmin,
  feedbackController.assignFeedback
);

router.post(
  "/:id/response",
  authenticate,
  isApprover,
  feedbackController.addResponse
);

router.post(
  "/:id/notes",
  authenticate,
  isApprover,
  feedbackController.addInternalNotes
);

router.get(
  "/admin/stats",
  authenticate,
  isAdmin,
  feedbackController.getFeedbackStats
);

router.delete(
  "/:id",
  authenticate,
  isAdmin,
  feedbackController.deleteFeedback
);

export default router;
