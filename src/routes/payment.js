import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles, isAdmin } from '../middleware/roles.js';
import {
  initiatePayment,
  processPaymentCallback,
  verifyPayment,
  getPayment,
  getUserPayments,
  requestRefund,
  processRefund,
  getPaymentStats,
  downloadInvoice,
  retryPayment,
} from '../controllers/payment.controller.js';

const router = express.Router();

// Protected routes
router.post('/', authenticate, initiatePayment);
router.get('/user/my-payments', authenticate, getUserPayments);
router.get('/:id', authenticate, getPayment);
router.post('/:transactionId/verify', authenticate, verifyPayment);
router.post('/:id/refund-request', authenticate, requestRefund);
router.post('/:id/retry', authenticate, retryPayment);
router.get('/:id/invoice', authenticate, downloadInvoice);

// Webhook - no authentication needed
router.post('/webhook/callback', processPaymentCallback);

// Admin routes
router.post('/:paymentId/refund', authenticate, isAdmin, processRefund);
router.get('/admin/stats', authenticate, isAdmin, getPaymentStats);

export default router;
