import { Router } from 'express';
import {
  createHub, getHubs, getHub, updateHub, deleteHub,
} from '../controllers/hubController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'dispatcher'));

router.post('/', createHub);
router.get('/', getHubs);
router.get('/:id', getHub);
router.patch('/:id', updateHub);
router.delete('/:id', authorize('admin', 'super_admin'), deleteHub);

export default router;
