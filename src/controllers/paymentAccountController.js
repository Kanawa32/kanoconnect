import { PaymentAccount } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const setPaymentAccount = asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber, sortCode } = req.body;

  if (!bankName || !accountName || !accountNumber) {
    throw new ApiError(400, 'bankName, accountName, and accountNumber are required');
  }

  let account = await PaymentAccount.findOne({ isActive: true });

  if (account) {
    Object.assign(account, { bankName, accountName, accountNumber, sortCode, setBy: req.user._id });
    await account.save();
  } else {
    account = await PaymentAccount.create({
      bankName, accountName, accountNumber, sortCode, setBy: req.user._id,
    });
  }

  successResponse(res, account, 'Payment account saved');
});

export const getActiveAccount = asyncHandler(async (req, res) => {
  const account = await PaymentAccount.findOne({ isActive: true }).lean();
  if (!account) {
    return res.json({ success: true, data: null, message: 'No active payment account' });
  }
  successResponse(res, account);
});

export const getAllAccounts = asyncHandler(async (req, res) => {
  const accounts = await PaymentAccount.find().sort('-createdAt').lean();
  successResponse(res, accounts);
});

export const updateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const account = await PaymentAccount.findByIdAndUpdate(id, { ...req.body, setBy: req.user._id }, { new: true, runValidators: true });
  if (!account) throw new ApiError(404, 'Payment account not found');
  successResponse(res, account, 'Account updated');
});

export const deactivateAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const account = await PaymentAccount.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!account) throw new ApiError(404, 'Payment account not found');
  successResponse(res, account, 'Account deactivated');
});
