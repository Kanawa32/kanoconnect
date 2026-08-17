import { Router } from 'express';
import {
  createFleet, getFleets, getFleet, updateFleet,
  deleteFleet, addVehicleToFleet, addRiderToFleet,
} from '../controllers/fleetController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'dispatcher'));

router.post('/', createFleet);
router.get('/', getFleets);
router.get('/:id', getFleet);
router.patch('/:id', updateFleet);
router.post('/:id/vehicles', addVehicleToFleet);
router.post('/:id/riders', addRiderToFleet);
router.delete('/:id', authorize('admin', 'super_admin'), deleteFleet);

export default router;
