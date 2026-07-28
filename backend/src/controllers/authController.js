import crypto from 'crypto';
import { User } from '../models/index.js';
import { generateTokenPair, generateVerificationToken, generateResetToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendWelcomeEmail } from '../config/email.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const verificationToken = generateVerificationToken();

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: 'customer',
    address,
    verificationToken,
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    // Non-blocking
  }

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Save refresh token
  user.refreshTokens.push({ token: refreshToken });
  await user.save();

  // Set cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  successResponse(res, {
    user: user.getPublicProfile(),
    accessToken,
    refreshToken,
  }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();

  const { accessToken, refreshToken } = generateTokenPair(user);

  // Limit refresh tokens to 5
  user.refreshTokens.push({ token: refreshToken });
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  await user.save();

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  successResponse(res, {
    user: user.getPublicProfile(),
    accessToken,
    refreshToken,
  }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.userId).select('+refreshTokens');

  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenExists = user.refreshTokens.some(rt => rt.token === token);
  if (!tokenExists) {
    throw new ApiError(401, 'Refresh token not found');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

  // Replace old refresh token
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
  user.refreshTokens.push({ token: newRefreshToken });
  await user.save();

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken && req.user) {
    req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt.token !== refreshToken);
    await req.user.save();
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  successResponse(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req, res) => {
  req.user.refreshTokens = [];
  await req.user.save();

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  successResponse(res, null, 'Logged out from all devices');
});

export const getMe = asyncHandler(async (req, res) => {
  successResponse(res, req.user.getPublicProfile());
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'avatar'];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  successResponse(res, user.getPublicProfile(), 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  successResponse(res, null, 'Password changed successfully. Please log in again.');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return successResponse(res, null, 'If an account exists, a reset link has been sent');
  }

  const { resetToken, hashedToken, expireTime } = generateResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expireTime;
  await user.save();

  // TODO: Send email with resetToken

  successResponse(res, null, 'If an account exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshTokens = [];
  await user.save();

  successResponse(res, null, 'Password reset successful');
});
