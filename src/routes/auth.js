import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorizeRoles, isAdmin } from "../middleware/roles.js";
import { validateRequest } from "../middleware/validator.js";
import { authValidations } from "../utils/validation.schemas.js";

const router = express.Router();

// Public routes
router.post(
  "/register",
  validateRequest(authValidations.register),
  authController.register
);

router.post(
  "/login",
  validateRequest(authValidations.login),
  authController.login
);

router.post("/logout", authController.logout);

router.post(
  "/request-password-reset",
  validateRequest(authValidations.requestPasswordReset),
  authController.requestPasswordReset
);

// Protected routes
router.get("/me", authenticate, authController.getCurrentUser);

router.put(
  "/update-profile",
  authenticate,
  validateRequest(authValidations.updateProfile),
  authController.updateProfile
);

router.post(
  "/change-password",
  authenticate,
  validateRequest(authValidations.changePassword),
  authController.changePassword
);

router.post("/verify-email", authenticate, authController.verifyEmail);

// Admin routes
router.get(
  "/users",
  authenticate,
  authorizeRoles("admin"),
  authController.getAllUsers
);

router.put(
  "/users/:userId/role",
  authenticate,
  authorizeRoles("admin"),
  authController.updateUserRole
);

router.delete(
  "/users/:userId",
  authenticate,
  authorizeRoles("admin"),
  authController.deleteUser
);

export default router;
