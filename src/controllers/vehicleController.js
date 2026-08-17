import { Vehicle, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  successResponse(res, vehicle, 'Vehicle created', 201);
});

export const getVehicles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type, search, sort = '-createdAt' } = req.query;

  const query = { isDeleted: false };
  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [vehicles, total] = await Promise.all([
    Vehicle.find(query)
      .populate('assignedRider', 'firstName lastName phone')
      .populate('fleet', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Vehicle.countDocuments(query),
  ]);

  paginatedResponse(res, vehicles, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('assignedRider', 'firstName lastName phone riderProfile')
    .populate('fleet', 'name region');

  if (!vehicle || vehicle.isDeleted) {
    throw new ApiError(404, 'Vehicle not found');
  }

  successResponse(res, vehicle);
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  successResponse(res, vehicle, 'Vehicle updated');
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  vehicle.isDeleted = true;
  await vehicle.save();

  successResponse(res, null, 'Vehicle deleted');
});

export const assignRider = asyncHandler(async (req, res) => {
  const { riderId } = req.body;

  const [vehicle, rider] = await Promise.all([
    Vehicle.findById(req.params.id),
    User.findById(riderId),
  ]);

  if (!vehicle || vehicle.isDeleted) {
    throw new ApiError(404, 'Vehicle not found');
  }

  if (!rider || rider.role !== 'rider') {
    throw new ApiError(400, 'Invalid rider');
  }

  // Unassign from previous rider
  if (vehicle.assignedRider) {
    await User.findByIdAndUpdate(vehicle.assignedRider, {
      $unset: { 'riderProfile.vehicleAssigned': '' },
    });
  }

  vehicle.assignedRider = riderId;
  await vehicle.save();

  await User.findByIdAndUpdate(riderId, {
    'riderProfile.vehicleAssigned': vehicle._id,
  });

  successResponse(res, vehicle, 'Rider assigned to vehicle');
});

export const addMaintenanceRecord = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle || vehicle.isDeleted) {
    throw new ApiError(404, 'Vehicle not found');
  }

  vehicle.maintenanceRecords.push(req.body);
  vehicle.lastMaintenanceDate = req.body.date;
  vehicle.nextMaintenanceDate = req.body.nextDueDate;
  vehicle.totalMaintenanceCost += req.body.cost || 0;

  await vehicle.save();
  successResponse(res, vehicle, 'Maintenance record added');
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    {
      'currentLocation.lat': lat,
      'currentLocation.lng': lng,
      'currentLocation.lastUpdated': new Date(),
    },
    { new: true }
  );

  successResponse(res, vehicle, 'Location updated');
});

export const getVehicleStats = asyncHandler(async (req, res) => {
  const stats = await Vehicle.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const byType = await Vehicle.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
      },
    },
  ]);

  successResponse(res, {
    byStatus: stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    byType: byType.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    total: stats.reduce((sum, s) => sum + s.count, 0),
  });
});
