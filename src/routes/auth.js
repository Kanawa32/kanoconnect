import { Router } from 'express';
import {
  register, login, refreshToken, logout, logoutAll,
  getMe, updateProfile, changePassword, forgotPassword, resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerValidator, loginValidator, validate } from '../middleware/validator.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate(registerValidator), register);
router.post('/login', authLimiter, loginValidator, validate(loginValidator), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
