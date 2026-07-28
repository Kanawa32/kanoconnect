import { Router } from 'express';
import { getPricing, updatePricing } from '../controllers/pricingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getPricing);
router.put('/', authorize('admin', 'super_admin'), updatePricing);

export default router;
