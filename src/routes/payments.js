import { Router } from 'express';
import {
  initiatePayment, verifyPaymentCallback, getPayments, getPayment, getPaymentStats,
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/:shipmentId/initiate', paymentLimiter, initiatePayment);
router.get('/verify', verifyPaymentCallback);
router.get('/', getPayments);
router.get('/stats', authorize('admin', 'super_admin', 'dispatcher'), getPaymentStats);
router.get('/:id', getPayment);

export default router;
