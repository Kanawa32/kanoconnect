import { Shipment, User, Notification } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';
import { geocodeAddress, calculateDistance, getDirections } from '../utils/geolocation.js';
import { sendShipmentNotification } from '../config/email.js';
import { sendShipmentSMS } from '../config/sms.js';
import { calculatePrice } from './pricingController.js';

export const createShipment = asyncHandler(async (req, res) => {
  const {
    pickupAddress,
    deliveryAddress,
    pickupDate,
    pickupTimeWindow,
    deliveryContactName,
    deliveryContactPhone,
    deliveryInstructions,
    items,
    serviceType,
    insurance,
  } = req.body;

  // Geocode addresses
  const [pickupGeo, deliveryGeo] = await Promise.all([
    geocodeAddress(pickupAddress),
    geocodeAddress(deliveryAddress),
  ]);

  if (!pickupGeo || !deliveryGeo) {
    throw new ApiError(400, 'Could not geocode one or both addresses');
  }

  // Calculate distance and route
  const routeInfo = await calculateDistance(pickupGeo, deliveryGeo);
  const directions = await getDirections(pickupGeo, deliveryGeo);

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const distance = routeInfo?.distance || 10;

  const pricing = await calculatePrice(distance, totalWeight, serviceType || 'standard');

  const shipment = await Shipment.create({
    customer: req.user._id,
    pickupAddress: pickupGeo.formattedAddress || pickupAddress,
    pickupCoordinates: pickupGeo,
    deliveryAddress: deliveryGeo.formattedAddress || deliveryAddress,
    deliveryCoordinates: deliveryGeo,
    pickupDate: new Date(pickupDate),
    pickupTimeWindow,
    deliveryContactName,
    deliveryContactPhone,
    deliveryInstructions,
    items,
    totalWeight,
    totalValue: items.reduce((sum, item) => sum + ((item.value || 0) * item.quantity), 0),
    ...pricing,
    serviceType: serviceType || 'standard',
    insurance: insurance || { isInsured: false },
    route: {
      distance,
      duration: routeInfo?.duration || 30,
      polyline: directions?.polyline,
    },
    trackingHistory: [{
      status: 'pending',
      location: { address: pickupAddress },
      note: 'Shipment created',
    }],
    source: 'web',
  });

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'shipment_update',
    title: 'Shipment Created',
    message: `Your shipment ${shipment.trackingNumber} has been created and is pending confirmation.`,
    shipment: shipment._id,
    actionUrl: `/shipments/${shipment._id}`,
  });

  successResponse(res, shipment, 'Shipment created successfully', 201);
});

export const getShipments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search, sort = '-createdAt' } = req.query;

  const query = { isDeleted: false };

  // Role-based filtering
  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (req.user.role === 'rider') {
    query.rider = req.user._id;
  } else if (req.user.role === 'dispatcher') {
    // Dispatchers see unassigned and their assigned
    query.$or = [
      { dispatcher: req.user._id },
      { dispatcher: { $exists: false }, status: 'pending' },
    ];
  }
  // Admin and super_admin see all

  if (status) query.status = status;
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [shipments, total] = await Promise.all([
    Shipment.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('rider', 'firstName lastName phone riderProfile.currentLocation')
      .populate('dispatcher', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Shipment.countDocuments(query),
  ]);

  paginatedResponse(res, shipments, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id)
    .populate('customer', 'firstName lastName email phone address')
    .populate('rider', 'firstName lastName phone riderProfile')
    .populate('dispatcher', 'firstName lastName')
    .populate('trackingHistory.updatedBy', 'firstName lastName role');

  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  // Check permissions
  const isOwner = shipment.customer._id.toString() === req.user._id.toString();
  const isRider = shipment.rider?._id.toString() === req.user._id.toString();
  const isAdmin = ['admin', 'super_admin', 'dispatcher'].includes(req.user.role);

  if (!isOwner && !isRider && !isAdmin) {
    throw new ApiError(403, 'Access denied');
  }

  successResponse(res, shipment);
});

export const getShipmentByTracking = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.params;

  const shipment = await Shipment.findOne({ trackingNumber, isDeleted: false })
    .populate('customer', 'firstName lastName')
    .populate('rider', 'firstName lastName')
    .select('-internalNotes -isDeleted');

  if (!shipment) {
    throw new ApiError(404, 'Shipment not found');
  }

  successResponse(res, shipment);
});

export const updateShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shipment = await Shipment.findById(id);

  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  // Only allow updates for pending shipments or by admin
  if (shipment.status !== 'pending' && !['admin', 'super_admin'].includes(req.user.role)) {
    throw new ApiError(400, 'Cannot update shipment that is already in progress');
  }

  const allowedUpdates = ['pickupDate', 'pickupTimeWindow', 'deliveryContactName', 
    'deliveryContactPhone', 'deliveryInstructions', 'items', 'serviceType'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const updated = await Shipment.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  successResponse(res, updated, 'Shipment updated');
});

export const updateShipmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, location } = req.body;

  const shipment = await Shipment.findById(id);
  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['picked_up', 'cancelled'],
    picked_up: ['in_transit'],
    in_transit: ['at_hub', 'out_for_delivery'],
    at_hub: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'returned'],
    delivered: [],
    cancelled: [],
    returned: [],
  };

  if (!validTransitions[shipment.status]?.includes(status)) {
    throw new ApiError(400, `Cannot transition from ${shipment.status} to ${status}`);
  }

  if (status === 'delivered' && shipment.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Payment must be confirmed before marking as delivered');
  }

  // Add tracking event
  await shipment.addTrackingEvent({
    status,
    location: location || { address: 'Location updated' },
    note: note || `Status updated to ${status}`,
    updatedBy: req.user._id,
  });

  // Update specific fields based on status
  if (status === 'delivered') {
    shipment.actualDeliveryTime = new Date();
    if (shipment.rider) {
      await User.findByIdAndUpdate(shipment.rider, {
        $inc: { 'riderProfile.totalDeliveries': 1 },
      });
    }
  }

  if (status === 'cancelled') {
    shipment.cancelledAt = new Date();
    shipment.cancelledBy = req.user._id;
    shipment.cancellationReason = note;
  }

  await shipment.save();

  // Notify customer
  const customer = await User.findById(shipment.customer);
  if (customer) {
    await Notification.create({
      user: customer._id,
      type: 'shipment_update',
      title: `Shipment ${status.replace('_', ' ').toUpperCase()}`,
      message: `Your shipment ${shipment.trackingNumber} is now ${status.replace('_', ' ')}.`,
      shipment: shipment._id,
    });

    try {
      await sendShipmentNotification(customer, shipment);
    } catch (e) { /* non-blocking */ }

    try {
      await sendShipmentSMS(customer, shipment);
    } catch (e) { /* non-blocking */ }
  }

  successResponse(res, shipment, `Shipment status updated to ${status}`);
});

export const assignRider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { riderId } = req.body;

  const [shipment, rider] = await Promise.all([
    Shipment.findById(id),
    User.findById(riderId),
  ]);

  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  if (!rider || rider.role !== 'rider') {
    throw new ApiError(400, 'Invalid rider');
  }

  shipment.rider = riderId;
  shipment.dispatcher = req.user._id;
  shipment.status = 'confirmed';

  shipment.trackingHistory.push({
    status: 'confirmed',
    note: `Assigned to rider ${rider.fullName}`,
    updatedBy: req.user._id,
  });

  await shipment.save();

  // Notify rider
  await Notification.create({
    user: riderId,
    type: 'shipment_update',
    title: 'New Assignment',
    message: `You have been assigned shipment ${shipment.trackingNumber}`,
    shipment: shipment._id,
  });

  successResponse(res, shipment, 'Rider assigned successfully');
});

export const rateShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, comment } = req.body;

  const shipment = await Shipment.findOne({
    _id: id,
    customer: req.user._id,
    status: 'delivered',
  });

  if (!shipment) {
    throw new ApiError(404, 'Shipment not found or not eligible for rating');
  }

  if (shipment.rating?.score) {
    throw new ApiError(400, 'Shipment already rated');
  }

  shipment.rating = { score, comment, createdAt: new Date() };
  await shipment.save();

  // Update rider rating
  if (shipment.rider) {
    const riderShipments = await Shipment.find({
      rider: shipment.rider,
      'rating.score': { $exists: true },
    });

    const avgRating = riderShipments.reduce((sum, s) => sum + s.rating.score, 0) / riderShipments.length;

    await User.findByIdAndUpdate(shipment.rider, {
      'riderProfile.rating': Math.round(avgRating * 10) / 10,
    });
  }

  successResponse(res, shipment, 'Rating submitted');
});

export const deleteShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment) {
    throw new ApiError(404, 'Shipment not found');
  }

  if (shipment.status !== 'pending') {
    throw new ApiError(400, 'Only pending shipments can be deleted');
  }

  shipment.isDeleted = true;
  await shipment.save();

  successResponse(res, null, 'Shipment deleted');
});

export const getAvailableOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { status: 'pending', paymentStatus: 'paid', isDeleted: false };
  query.$or = [{ rider: { $exists: false } }, { rider: null }];

  const [shipments, total] = await Promise.all([
    Shipment.find(query)
      .populate('customer', 'firstName lastName phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Shipment.countDocuments(query),
  ]);

  paginatedResponse(res, shipments, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  if (shipment.paymentStatus === 'paid') {
    throw new ApiError(400, 'Payment already confirmed');
  }

  shipment.paymentStatus = 'paid';
  shipment.paymentMethod = 'bank_transfer';
  await shipment.save();

  successResponse(res, shipment, 'Payment confirmed');
});

export const setRiderEarnings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;

  if (amount == null || amount < 0) {
    throw new ApiError(400, 'Valid earnings amount is required');
  }

  const shipment = await Shipment.findById(id);
  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  shipment.riderEarnings = amount;
  await shipment.save();

  successResponse(res, shipment, 'Rider earnings updated');
});

export const confirmDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Shipment not found');
  }

  if (shipment.customer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the customer can confirm delivery');
  }

  if (shipment.status !== 'out_for_delivery') {
    throw new ApiError(400, 'Delivery can only be confirmed when status is Out for Delivery');
  }

  if (shipment.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Payment must be confirmed before delivery');
  }

  await shipment.addTrackingEvent({
    status: 'delivered',
    location: { address: shipment.deliveryAddress },
    note: 'Delivery confirmed by customer',
    updatedBy: req.user._id,
  });

  shipment.actualDeliveryTime = new Date();

  if (shipment.rider) {
    await User.findByIdAndUpdate(shipment.rider, {
      $inc: { 'riderProfile.totalDeliveries': 1 },
    });
  }

  await shipment.save();

  successResponse(res, shipment, 'Delivery confirmed successfully');
});

export const acceptOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shipment = await Shipment.findById(id);
  if (!shipment || shipment.isDeleted) {
    throw new ApiError(404, 'Order not found');
  }

  if (shipment.status !== 'pending') {
    throw new ApiError(400, 'Order is no longer available');
  }

  if (shipment.rider) {
    throw new ApiError(400, 'Order already assigned to a rider');
  }

  if (shipment.paymentStatus !== 'paid') {
    throw new ApiError(400, 'Payment must be completed before order can be accepted');
  }

  shipment.rider = req.user._id;
  shipment.status = 'confirmed';
  shipment.trackingHistory.push({
    status: 'confirmed',
    note: `Order accepted by rider ${req.user.firstName} ${req.user.lastName}`,
    updatedBy: req.user._id,
  });

  await shipment.save();

  const populated = await Shipment.findById(id)
    .populate('customer', 'firstName lastName phone')
    .populate('rider', 'firstName lastName phone');

  successResponse(res, populated, 'Order accepted successfully');
});

export const getShipmentStats = asyncHandler(async (req, res) => {
  const matchStage = { isDeleted: false };

  if (req.user.role === 'customer') {
    matchStage.customer = req.user._id;
  } else if (req.user.role === 'rider') {
    matchStage.rider = req.user._id;
  }

  const stats = await Shipment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
  ]);

  const totalShipments = stats.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

  successResponse(res, {
    totalShipments,
    totalRevenue,
    byStatus: stats.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {}),
  });
});
