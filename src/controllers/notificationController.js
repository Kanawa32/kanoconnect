import { Notification } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { user: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .populate('shipment', 'trackingNumber status')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  paginatedResponse(res, notifications, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    unreadCount,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  successResponse(res, notification, 'Marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  successResponse(res, null, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  successResponse(res, null, 'Notification deleted');
});

export const createNotification = asyncHandler(async (req, res) => {
  // Admin only
  const notification = await Notification.create(req.body);
  successResponse(res, notification, 'Notification created', 201);
});
