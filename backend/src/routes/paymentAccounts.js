import { Router } from 'express';
import {
  setPaymentAccount, getActiveAccount, getAllAccounts, updateAccount, deactivateAccount,
} from '../controllers/paymentAccountController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin', 'super_admin'), setPaymentAccount);
router.get('/active', getActiveAccount);
router.get('/', authorize('admin', 'super_admin'), getAllAccounts);
router.put('/:id', authorize('admin', 'super_admin'), updateAccount);
router.patch('/:id/deactivate', authorize('admin', 'super_admin'), deactivateAccount);

export default router;
