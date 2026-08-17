import { Router } from 'express';
import {
  setBankAccount, getBankAccount, getBalance, requestWithdrawal,
  getMyWithdrawals, getAllWithdrawals, processWithdrawal,
} from '../controllers/withdrawalController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/bank-account', getBankAccount);
router.post('/bank-account', authorize('rider'), setBankAccount);
router.get('/balance', authorize('rider'), getBalance);
router.post('/request', authorize('rider'), requestWithdrawal);
router.get('/my', authorize('rider'), getMyWithdrawals);
router.get('/', authorize('admin', 'super_admin'), getAllWithdrawals);
router.patch('/:id/process', authorize('admin', 'super_admin'), processWithdrawal);

export default router;
