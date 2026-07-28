import { Hub } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse, paginatedResponse } from '../utils/response.js';

export const createHub = asyncHandler(async (req, res) => {
  const hub = await Hub.create(req.body);
  successResponse(res, hub, 'Hub created', 201);
});

export const getHubs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, city, search } = req.query;

  const query = { isDeleted: false };
  if (type) query.type = type;
  if (city) query['address.city'] = { $regex: city, $options: 'i' };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [hubs, total] = await Promise.all([
    Hub.find(query)
      .populate('contact.manager', 'firstName lastName email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Hub.countDocuments(query),
  ]);

  paginatedResponse(res, hubs, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

export const getHub = asyncHandler(async (req, res) => {
  const hub = await Hub.findById(req.params.id)
    .populate('contact.manager', 'firstName lastName email phone');

  if (!hub || hub.isDeleted) {
    throw new ApiError(404, 'Hub not found');
  }

  successResponse(res, hub);
});

export const updateHub = asyncHandler(async (req, res) => {
  const hub = await Hub.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!hub) {
    throw new ApiError(404, 'Hub not found');
  }

  successResponse(res, hub, 'Hub updated');
});

export const deleteHub = asyncHandler(async (req, res) => {
  const hub = await Hub.findById(req.params.id);
  if (!hub) {
    throw new ApiError(404, 'Hub not found');
  }

  hub.isDeleted = true;
  await hub.save();

  successResponse(res, null, 'Hub deleted');
});
