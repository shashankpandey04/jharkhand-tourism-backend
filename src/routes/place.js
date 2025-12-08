import express from "express";
import * as placeController from "../controllers/place.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  authorizeRoles,
  isAdmin,
  isApprover,
} from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { placeValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.get("/", placeController.getAllPlaces);

router.get("/featured", placeController.getFeaturedPlaces);

router.get("/city/:city", placeController.getPlacesByCity);

router.get("/search/nearby", placeController.searchNearbyPlaces);

router.get("/:identifier", placeController.getPlace);

// Protected routes
router.post(
  "/",
  authenticate,
  validateRequest(placeValidations.create),
  placeController.createPlace
);

router.put(
  "/:id",
  authenticate,
  validateRequest(placeValidations.update),
  placeController.updatePlace
);

router.delete("/:id", authenticate, placeController.deletePlace);

router.post(
  "/:id/images",
  authenticate,
  placeController.uploadPlaceImages
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  placeController.deletePlaceImage
);

// Admin routes
router.put(
  "/:id/verify",
  authenticate,
  isAdmin,
  placeController.verifyPlace
);

export default router;
