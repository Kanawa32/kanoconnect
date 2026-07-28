import { Payment, Shipment } from '../models/index.js';
import { initializePayment, verifyPayment } from '../config/paystack.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export const initiatePayment = asyncHandler(async (req, res) => {
  const { shipmentId } = req.params;

  const shipment = await Shipment.findOne({
    _id: shipmentId,
    customer: req.user._id,
    isDeleted: false,
  });

  if (!shipment) {
    throw new ApiError(404, 'Shipment not found');
  }

  if (shipment.paymentStatus === 'paid') {
    throw new ApiError(400, 'Shipment already paid for');
  }

  const reference = `KNC-${uuidv4()}`;

  // Create payment record
  const payment = await Payment.create({
    user: req.user._id,
    shipment: shipmentId,
    amount: shipment.totalAmount,
    reference,
    status: 'pending',
  });

  // Initialize Paystack
  const paystackResponse = await initializePayment({
    email: req.user.email,
    amount: shipment.totalAmount,
    metadata: {
      shipmentId: shipment._id.toString(),
      paymentId: payment._id.toString(),
      userId: req.user._id.toString(),
    },
    callback_url: `${process.env.CLIENT_URL}/payment/callback`,
  });

  // Update payment with Paystack details
  payment.authorizationUrl = paystackResponse.data.authorization_url;
  payment.accessCode = paystackResponse.data.access_code;
  payment.paystackReference = paystackResponse.data.reference;
  await payment.save();

  successResponse(res, {
    authorizationUrl: paystackResponse.data.authorization_url,
    reference: paystackResponse.data.reference,
    accessCode: paystackResponse.data.access_code,
    paymentId: payment._id,
  }, 'Payment initialized');
});

export const verifyPaymentCallback = asyncHandler(async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    throw new ApiError(400, 'Payment reference is required');
  }

  const paystackData = await verifyPayment(reference);

  if (!paystackData.status) {
    throw new ApiError(400, 'Payment verification failed');
  }

  const payment = await Payment.findOne({ paystackReference: reference });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  const transaction = paystackData.data;

  // Update payment
  payment.status = transaction.status === 'success' ? 'success' : transaction.status;
  payment.channel = transaction.channel;
  payment.cardType = transaction.authorization?.card_type;
  payment.bank = transaction.authorization?.bank;
  payment.last4 = transaction.authorization?.last4;
  payment.paystackFees = transaction.fees;
  payment.paidAt = transaction.paid_at ? new Date(transaction.paid_at) : null;
  payment.verifiedAt = new Date();
  await payment.save();

  // Update shipment
  if (transaction.status === 'success') {
    await Shipment.findByIdAndUpdate(payment.shipment, {
      paymentStatus: 'paid',
      paymentReference: reference,
      paymentMethod: 'paystack',
    });
  }

  successResponse(res, {
    status: payment.status,
    amount: payment.amount,
    reference: payment.reference,
    paidAt: payment.paidAt,
  }, 'Payment verified');
});

export const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = {};
  if (req.user.role === 'customer') {
    query.user = req.user._id;
  }
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('user', 'firstName lastName email')
      .populate('shipment', 'trackingNumber status')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payment.countDocuments(query),
  ]);

  successResponse(res, { payments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

export const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'firstName lastName email')
    .populate('shipment', 'trackingNumber status pickupAddress deliveryAddress');

  if (!payment) {
    throw new ApiError(404, 'Payment not found');
  }

  if (req.user.role === 'customer' && payment.user._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  successResponse(res, payment);
});

export const getPaymentStats = asyncHandler(async (req, res) => {
  const matchStage = {};
  if (req.user.role === 'customer') {
    matchStage.user = req.user._id;
  }

  const stats = await Payment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  const dailyRevenue = await Payment.aggregate([
    { $match: { ...matchStage, status: 'success' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 30 },
  ]);

  successResponse(res, {
    byStatus: stats.reduce((acc, s) => { acc[s._id] = { count: s.count, amount: s.totalAmount }; return acc; }, {}),
    dailyRevenue,
  });
});
