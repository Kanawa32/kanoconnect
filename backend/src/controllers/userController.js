import { User, Shipment } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search, status } = req.query;

  const query = { isDeleted: { $ne: true } };
  if (role) query.role = role;
  if (status !== undefined) query.isActive = status === 'active';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -refreshTokens -verificationToken -resetPasswordToken')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  paginatedResponse(res, users, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshTokens -verificationToken -resetPasswordToken')
    .populate('riderProfile.vehicleAssigned', 'name registrationNumber type');

  if (!user || user.isDeleted) {
    throw new ApiError(404, 'User not found');
  }

  successResponse(res, user);
});

export const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, role, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: role || 'customer',
    address,
  });

  successResponse(res, user.getPublicProfile(), 'User created', 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'role', 'isActive', 'address', 'avatar', 'riderProfile', 'customerProfile', 'adminProfile'];
  const updates = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  successResponse(res, user, 'User updated');
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isDeleted = true;
  user.isActive = false;
  await user.save();

  successResponse(res, null, 'User deleted');
});

export const getRiders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isOnline, search } = req.query;

  const query = { role: 'rider', isDeleted: { $ne: true }, isActive: true };
  if (isOnline !== undefined) query['riderProfile.isOnline'] = isOnline === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [riders, total] = await Promise.all([
    User.find(query)
      .select('firstName lastName email phone avatar riderProfile')
      .sort('-riderProfile.rating')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  paginatedResponse(res, riders, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const updateRiderLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      'riderProfile.currentLocation.lat': lat,
      'riderProfile.currentLocation.lng': lng,
      'riderProfile.currentLocation.lastUpdated': new Date(),
    },
    { new: true }
  );

  successResponse(res, user.riderProfile.currentLocation, 'Location updated');
});

export const toggleRiderStatus = asyncHandler(async (req, res) => {
  const { isOnline } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { 'riderProfile.isOnline': isOnline },
    { new: true }
  );

  successResponse(res, { isOnline: user.riderProfile.isOnline }, 'Status updated');
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const role = req.user.role;
  const userId = req.user._id;

  if (role === 'rider') {
    const [assignedShipments, activeDeliveries, completedDeliveries, pendingDeliveries] = await Promise.all([
      Shipment.countDocuments({ rider: userId, isDeleted: false }),
      Shipment.countDocuments({ rider: userId, status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }, isDeleted: false }),
      Shipment.countDocuments({ rider: userId, status: 'delivered', isDeleted: false }),
      Shipment.countDocuments({ rider: userId, status: { $in: ['confirmed', 'pending'] }, isDeleted: false }),
    ]);

    const earnings = await Shipment.aggregate([
      { $match: { rider: userId, status: 'delivered', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const recentShipments = await Shipment.find({ rider: userId, isDeleted: false })
      .populate('customer', 'firstName lastName')
      .sort('-createdAt')
      .limit(5)
      .lean();

    return successResponse(res, {
      assignedShipments,
      activeDeliveries,
      completedDeliveries,
      pendingDeliveries,
      totalEarnings: earnings[0]?.total || 0,
      recentShipments,
    });
  }

  if (role === 'customer') {
    const [totalShipments, activeShipments, deliveredShipments, pendingShipments] = await Promise.all([
      Shipment.countDocuments({ customer: userId, isDeleted: false }),
      Shipment.countDocuments({ customer: userId, status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] }, isDeleted: false }),
      Shipment.countDocuments({ customer: userId, status: 'delivered', isDeleted: false }),
      Shipment.countDocuments({ customer: userId, status: 'pending', isDeleted: false }),
    ]);

    const totalSpent = await Shipment.aggregate([
      { $match: { customer: userId, paymentStatus: 'paid', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const recentShipments = await Shipment.find({ customer: userId, isDeleted: false })
      .populate('rider', 'firstName lastName')
      .sort('-createdAt')
      .limit(5)
      .lean();

    return successResponse(res, {
      totalShipments,
      activeShipments,
      deliveredShipments,
      pendingShipments,
      totalSpent: totalSpent[0]?.total || 0,
      recentShipments,
    });
  }

  // Admin / dispatcher / super_admin
  const [totalUsers, totalShipments, totalRevenue, todayShipments, pendingShipments, activeRiders] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    Shipment.countDocuments({ isDeleted: false }),
    Shipment.aggregate([
      { $match: { paymentStatus: 'paid', isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Shipment.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
    Shipment.countDocuments({ status: 'pending', isDeleted: false }),
    User.countDocuments({ role: 'rider', 'riderProfile.isOnline': true, isActive: true }),
  ]);

  const recentShipments = await Shipment.find({ isDeleted: false })
    .populate('customer', 'firstName lastName')
    .populate('rider', 'firstName lastName')
    .sort('-createdAt')
    .limit(5)
    .lean();

  successResponse(res, {
    totalUsers,
    totalShipments,
    totalRevenue: totalRevenue[0]?.total || 0,
    todayShipments,
    pendingShipments,
    activeRiders,
    recentShipments,
  });
});
