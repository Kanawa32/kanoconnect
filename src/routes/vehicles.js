import { Router } from 'express';
import {
  createVehicle, getVehicles, getVehicle, updateVehicle,
  deleteVehicle, assignRider, addMaintenanceRecord, updateLocation, getVehicleStats,
} from '../controllers/vehicleController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createVehicleValidator, validate } from '../middleware/validator.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'dispatcher'));

router.post('/', validate(createVehicleValidator), createVehicle);
router.get('/', getVehicles);
router.get('/stats', getVehicleStats);
router.get('/:id', getVehicle);
router.patch('/:id', updateVehicle);
router.patch('/:id/assign-rider', assignRider);
router.post('/:id/maintenance', addMaintenanceRecord);
router.patch('/:id/location', updateLocation);
router.delete('/:id', authorize('admin', 'super_admin'), deleteVehicle);

export default router;
