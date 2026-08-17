import { Router } from 'express';
import {
  getUsers, getUser, createUser, updateUser, deleteUser,
  getRiders, updateRiderLocation, toggleRiderStatus, getDashboardStats,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);
router.get('/riders', getRiders);
router.patch('/rider/location', authorize('rider'), updateRiderLocation);
router.patch('/rider/status', authorize('rider'), toggleRiderStatus);

router.get('/', authorize('admin', 'super_admin', 'dispatcher'), getUsers);
router.post('/', authorize('admin', 'super_admin'), createUser);
router.get('/:id', getUser);
router.patch('/:id', authorize('admin', 'super_admin'), updateUser);
router.delete('/:id', authorize('admin', 'super_admin'), deleteUser);

export default router;
