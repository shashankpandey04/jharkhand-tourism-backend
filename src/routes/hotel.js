import express from "express";
import * as hotelController from "../controllers/hotel.controller.js";
import { authenticate } from "../middleware/auth.js";
import {
  authorizeRoles,
  isAdmin,
  isApprover,
} from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { hotelValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.get(
  "/",
  validateRequest(hotelValidations.search),
  hotelController.getAllHotels
);

router.get("/:id", hotelController.getHotelById);

router.get("/featured", hotelController.getFeaturedHotels);

router.get(
  "/search/nearby",
  hotelController.searchNearbyHotels
);

// Protected routes
router.post(
  "/",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  validateRequest(hotelValidations.create),
  hotelController.createHotel
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  validateRequest(hotelValidations.update),
  hotelController.updateHotel
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  hotelController.deleteHotel
);

router.post(
  "/:id/images",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  hotelController.uploadHotelImages
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  hotelController.deleteHotelImage
);

router.get(
  "/owner/my-hotels",
  authenticate,
  authorizeRoles("hotel_owner", "admin"),
  hotelController.getMyHotels
);

// Moderator/Admin routes
router.put(
  "/:id/approve",
  authenticate,
  isApprover,
  hotelController.approveHotel
);

router.put(
  "/:id/reject",
  authenticate,
  isApprover,
  hotelController.rejectHotel
);

export default router;
