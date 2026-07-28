import { Router } from 'express';
import authRoutes from './auth.js';
import shipmentRoutes from './shipments.js';
import vehicleRoutes from './vehicles.js';
import fleetRoutes from './fleets.js';
import paymentRoutes from './payments.js';
import notificationRoutes from './notifications.js';
import userRoutes from './users.js';
import hubRoutes from './hubs.js';
import reportRoutes from './reports.js';
import geocodeRoutes from './geocode.js';
import paymentAccountRoutes from './paymentAccounts.js';
import pricingRoutes from './pricing.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/fleets', fleetRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);
router.use('/hubs', hubRoutes);
router.use('/reports', reportRoutes);
router.use('/payment-accounts', paymentAccountRoutes);
router.use('/pricing', pricingRoutes);
router.use('/geocode', geocodeRoutes);

export default router;
