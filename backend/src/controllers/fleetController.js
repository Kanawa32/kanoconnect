import { Fleet, Vehicle, User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const createFleet = asyncHandler(async (req, res) => {
  const fleet = await Fleet.create(req.body);
  successResponse(res, fleet, 'Fleet created', 201);
});

export const getFleets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = { isDeleted: false };
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'region.city': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [fleets, total] = await Promise.all([
    Fleet.find(query)
      .populate('manager', 'firstName lastName email')
      .populate('vehicles', 'name registrationNumber status type')
      .populate('riders', 'firstName lastName phone riderProfile.isOnline')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Fleet.countDocuments(query),
  ]);

  paginatedResponse(res, fleets, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getFleet = asyncHandler(async (req, res) => {
  const fleet = await Fleet.findById(req.params.id)
    .populate('manager', 'firstName lastName email phone')
    .populate('vehicles', 'name registrationNumber status type currentLocation')
    .populate('riders', 'firstName lastName phone riderProfile');

  if (!fleet || fleet.isDeleted) {
    throw new ApiError(404, 'Fleet not found');
  }

  successResponse(res, fleet);
});

export const updateFleet = asyncHandler(async (req, res) => {
  const fleet = await Fleet.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!fleet) {
    throw new ApiError(404, 'Fleet not found');
  }

  successResponse(res, fleet, 'Fleet updated');
});

export const deleteFleet = asyncHandler(async (req, res) => {
  const fleet = await Fleet.findById(req.params.id);
  if (!fleet) {
    throw new ApiError(404, 'Fleet not found');
  }

  fleet.isDeleted = true;
  await fleet.save();

  successResponse(res, null, 'Fleet deleted');
});

export const addVehicleToFleet = asyncHandler(async (req, res) => {
  const { vehicleId } = req.body;

  const [fleet, vehicle] = await Promise.all([
    Fleet.findById(req.params.id),
    Vehicle.findById(vehicleId),
  ]);

  if (!fleet || fleet.isDeleted) {
    throw new ApiError(404, 'Fleet not found');
  }

  if (!vehicle || vehicle.isDeleted) {
    throw new ApiError(404, 'Vehicle not found');
  }

  if (!fleet.vehicles.includes(vehicleId)) {
    fleet.vehicles.push(vehicleId);
    await fleet.save();
  }

  vehicle.fleet = fleet._id;
  await vehicle.save();

  successResponse(res, fleet, 'Vehicle added to fleet');
});

export const addRiderToFleet = asyncHandler(async (req, res) => {
  const { riderId } = req.body;

  const [fleet, rider] = await Promise.all([
    Fleet.findById(req.params.id),
    User.findById(riderId),
  ]);

  if (!fleet || fleet.isDeleted) {
    throw new ApiError(404, 'Fleet not found');
  }

  if (!rider || rider.role !== 'rider') {
    throw new ApiError(400, 'Invalid rider');
  }

  if (!fleet.riders.includes(riderId)) {
    fleet.riders.push(riderId);
    await fleet.save();
  }

  successResponse(res, fleet, 'Rider added to fleet');
});
