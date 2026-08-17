import { Router } from 'express';
import {
  getRevenueReport, getShipmentReport, getRiderPerformance, getFleetReport, exportReport,
} from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'dispatcher'));

router.get('/revenue', getRevenueReport);
router.get('/shipments', getShipmentReport);
router.get('/riders', getRiderPerformance);
router.get('/fleet', getFleetReport);
router.get('/export', exportReport);

export default router;
