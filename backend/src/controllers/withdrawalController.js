import { User, Shipment, Notification } from '../models/index.js';
import Withdrawal from '../models/Withdrawal.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { createTransferRecipient, initiateTransfer } from '../config/paystack.js';
import logger from '../utils/logger.js';

export const setBankAccount = asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber, bankCode } = req.body;
  if (!bankName || !accountName || !accountNumber) {
    throw new ApiError(400, 'Bank name, account name, and account number are required');
  }

  const user = await User.findById(req.user._id);
  user.riderProfile.bankDetails = {
    bankName,
    accountName,
    accountNumber,
    bankCode: bankCode || user.riderProfile?.bankDetails?.bankCode || '',
  };
  await user.save();

  successResponse(res, user.riderProfile.bankDetails, 'Bank account saved');
});

export const getBankAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('riderProfile.bankDetails');
  successResponse(res, user.riderProfile?.bankDetails || null);
});

export const getBalance = asyncHandler(async (req, res) => {
  const result = await Shipment.aggregate([
    { $match: { rider: req.user._id, status: 'delivered', isDeleted: false } },
    { $group: { _id: null, totalEarnings: { $sum: '$riderEarnings' } } },
  ]);

  const totalEarnings = result[0]?.totalEarnings || 0;

  const paidResult = await Withdrawal.aggregate([
    { $match: { rider: req.user._id, status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
  ]);

  const totalPaid = paidResult[0]?.totalPaid || 0;

  successResponse(res, {
    totalEarnings,
    totalWithdrawn: totalPaid,
    availableBalance: totalEarnings - totalPaid,
  });
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid withdrawal amount');
  }

  const user = await User.findById(req.user._id);
  const bankDetails = user.riderProfile?.bankDetails;
  if (!bankDetails?.accountNumber) {
    throw new ApiError(400, 'Please set your bank account details first');
  }

  const result = await Shipment.aggregate([
    { $match: { rider: req.user._id, status: 'delivered', isDeleted: false } },
    { $group: { _id: null, totalEarnings: { $sum: '$riderEarnings' } } },
  ]);
  const totalEarnings = result[0]?.totalEarnings || 0;

  const paidResult = await Withdrawal.aggregate([
    { $match: { rider: req.user._id, status: { $in: ['approved', 'paid'] } } },
    { $group: { _id: null, totalPaid: { $sum: '$amount' } } },
  ]);
  const totalPaid = paidResult[0]?.totalPaid || 0;
  const availableBalance = totalEarnings - totalPaid;

  if (amount > availableBalance) {
    throw new ApiError(400, 'Insufficient balance');
  }

  const withdrawal = await Withdrawal.create({
    rider: req.user._id,
    amount,
    bankDetails: {
      bankName: bankDetails.bankName,
      accountName: bankDetails.accountName,
      accountNumber: bankDetails.accountNumber,
      bankCode: bankDetails.bankCode,
    },
  });

  const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }, '_id');
  const notifications = admins.map((admin) => ({
    user: admin._id,
    type: 'payment',
    title: 'Withdrawal Request',
    message: `Rider ${req.user.firstName} ${req.user.lastName} requested withdrawal of ₦${amount.toLocaleString()}`,
    actionUrl: `/withdrawals`,
    actionLabel: 'View Requests',
    priority: 'high',
  }));
  await Notification.insertMany(notifications);

  successResponse(res, withdrawal, 'Withdrawal request submitted');
});

export const getMyWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [withdrawals, total] = await Promise.all([
    Withdrawal.find({ rider: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Withdrawal.countDocuments({ rider: req.user._id }),
  ]);

  paginatedResponse(res, withdrawals, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getAllWithdrawals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status) query.status = status;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [withdrawals, total] = await Promise.all([
    Withdrawal.find(query)
      .populate('rider', 'firstName lastName email phone')
      .populate('processedBy', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Withdrawal.countDocuments(query),
  ]);

  paginatedResponse(res, withdrawals, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const processWithdrawal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(400, 'Status must be approved or rejected');
  }

  const withdrawal = await Withdrawal.findById(id).populate('rider', 'firstName lastName email');
  if (!withdrawal) throw new ApiError(404, 'Withdrawal not found');
  if (withdrawal.status !== 'pending') throw new ApiError(400, 'Withdrawal already processed');

  if (status === 'approved') {
    try {
      const rider = await User.findById(withdrawal.rider._id);
      const bank = rider.riderProfile?.bankDetails;
      if (!bank?.bankCode) {
        throw new ApiError(400, 'Rider has not set their bank code for transfers');
      }

      let recipientCode = bank.recipientCode;

      if (!recipientCode) {
        const recipientRes = await createTransferRecipient({
          type: 'nuban',
          name: bank.accountName,
          account_number: bank.accountNumber,
          bank_code: bank.bankCode,
        });
        recipientCode = recipientRes.data.recipient_code;
        await User.findByIdAndUpdate(withdrawal.rider._id, {
          'riderProfile.bankDetails.recipientCode': recipientCode,
        });
      }

      const transferRes = await initiateTransfer({
        source: 'balance',
        amount: withdrawal.amount,
        recipient: recipientCode,
        reason: `Rider withdrawal for ${withdrawal.rider.firstName} ${withdrawal.rider.lastName}`,
      });

      withdrawal.transferReference = transferRes.data.reference;
      withdrawal.transferCode = transferRes.data.transfer_code;
      withdrawal.status = 'paid';
    } catch (transferError) {
      logger.error(`Auto-transfer failed: ${transferError.message}`);
      withdrawal.status = 'approved';
      withdrawal.adminNote = (adminNote || '') + ` | Transfer failed: ${transferError.message}`.trim();
    }
  } else {
    withdrawal.status = status;
  }

  withdrawal.adminNote = adminNote || withdrawal.adminNote || '';
  withdrawal.processedBy = req.user._id;
  withdrawal.processedAt = new Date();
  await withdrawal.save();

  await Notification.create({
    user: withdrawal.rider._id,
    type: 'payment',
    title: withdrawal.status === 'paid' ? 'Withdrawal Paid' : status === 'approved' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
    message: withdrawal.status === 'paid'
      ? `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been paid to your bank account`
      : status === 'approved'
        ? `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been approved. Payment will be processed shortly.`
        : `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} was rejected${adminNote ? `: ${adminNote}` : ''}`,
    actionUrl: '/withdrawals',
    actionLabel: 'View Details',
  });

  successResponse(res, withdrawal, `Withdrawal ${status}`);
});
