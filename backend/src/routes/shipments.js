import { Router } from 'express';
import {
  createShipment, getShipments, getShipment, getShipmentByTracking,
  updateShipment, updateShipmentStatus, assignRider, rateShipment,
  deleteShipment, getShipmentStats, getAvailableOrders, acceptOrder,
  confirmPayment, confirmDelivery,
} from '../controllers/shipmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createShipmentValidator, validate } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createShipmentValidator), createShipment);
router.get('/', getShipments);
router.get('/available', authorize('rider'), getAvailableOrders);
router.get('/stats', getShipmentStats);
router.get('/track/:trackingNumber', getShipmentByTracking);
router.get('/:id', getShipment);
router.patch('/:id', updateShipment);
router.patch('/:id/status', authorize('rider', 'dispatcher', 'admin', 'super_admin'), updateShipmentStatus);
router.patch('/:id/assign-rider', authorize('dispatcher', 'admin', 'super_admin'), assignRider);
router.patch('/:id/accept', authorize('rider'), acceptOrder);
router.patch('/:id/confirm-payment', authorize('admin', 'super_admin'), confirmPayment);
router.post('/:id/confirm-delivery', authorize('customer'), confirmDelivery);
router.post('/:id/rate', authorize('customer'), rateShipment);
router.delete('/:id', deleteShipment);

export default router;
