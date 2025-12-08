import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles, isAdmin } from '../middleware/roles.js';
import {
  createPackage,
  getAllPackages,
  getPackage,
  updatePackage,
  deletePackage,
  getFeaturedPackages,
  getPopularPackages,
  searchPackagesByLocation,
  searchPackagesByCategory,
  getPackageStats,
  addPackageReview,
  getPackageAvailability,
  bookPackage,
} from '../controllers/package.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllPackages);
router.get('/featured', getFeaturedPackages);
router.get('/popular', getPopularPackages);
router.get('/stats', getPackageStats);
router.get('/search/location/:city', searchPackagesByLocation);
router.get('/search/category/:category', searchPackagesByCategory);
router.get('/availability/:packageId', getPackageAvailability);
router.get('/:id', getPackage);

// Protected routes
router.post('/', authenticate, authorizeRoles('Contributor', 'Admin'), createPackage);
router.put('/:id', authenticate, authorizeRoles('Contributor', 'Admin'), updatePackage);
router.delete('/:id', authenticate, authorizeRoles('Contributor', 'Admin'), deletePackage);
router.post('/:packageId/review', authenticate, addPackageReview);
router.post('/:packageId/book', authenticate, bookPackage);

export default router;
