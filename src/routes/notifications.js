import { Router } from 'express';
import {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, createNotification,
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/', authorize('admin', 'super_admin'), createNotification);

export default router;
