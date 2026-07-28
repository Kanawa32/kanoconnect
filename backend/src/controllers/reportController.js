import { Shipment, Payment, User, Vehicle } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const matchStage = { paymentStatus: 'paid', isDeleted: false };
  if (startDate) matchStage.createdAt = { $gte: new Date(startDate) };
  if (endDate) {
    matchStage.createdAt = matchStage.createdAt || {};
    matchStage.createdAt.$lte = new Date(endDate);
  }

  const format = groupBy === 'month' ? '%Y-%m' : groupBy === 'week' ? '%Y-W%U' : '%Y-%m-%d';

  const revenue = await Shipment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  successResponse(res, { revenue, groupBy });
});

export const getShipmentReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = { isDeleted: false };
  if (startDate) matchStage.createdAt = { $gte: new Date(startDate) };
  if (endDate) {
    matchStage.createdAt = matchStage.createdAt || {};
    matchStage.createdAt.$lte = new Date(endDate);
  }

  const [byStatus, byServiceType, byRegion, dailyStats] = await Promise.all([
    Shipment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Shipment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$serviceType', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
    Shipment.aggregate([
      { $match: matchStage },
      { $group: { _id: '$pickupAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Shipment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          created: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  successResponse(res, {
    byStatus: byStatus.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
    byServiceType,
    topRegions: byRegion,
    dailyStats,
  });
});

export const getRiderPerformance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const matchStage = { status: 'delivered', isDeleted: false };
  if (startDate) matchStage.createdAt = { $gte: new Date(startDate) };
  if (endDate) {
    matchStage.createdAt = matchStage.createdAt || {};
    matchStage.createdAt.$lte = new Date(endDate);
  }

  const performance = await Shipment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$rider',
        totalDeliveries: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        avgDeliveryTime: {
          $avg: {
            $divide: [
              { $subtract: ['$actualDeliveryTime', '$pickupDate'] },
              1000 * 60,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'rider',
      },
    },
    { $unwind: '$rider' },
    {
      $project: {
        riderName: { $concat: ['$rider.firstName', ' ', '$rider.lastName'] },
        totalDeliveries: 1,
        totalRevenue: 1,
        avgDeliveryTime: 1,
      },
    },
    { $sort: { totalDeliveries: -1 } },
  ]);

  successResponse(res, { performance });
});

export const getFleetReport = asyncHandler(async (req, res) => {
  const fleetStats = await Vehicle.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$fleet',
        vehicleCount: { $sum: 1 },
        activeVehicles: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        maintenanceVehicles: {
          $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] },
        },
        totalMaintenanceCost: { $sum: '$totalMaintenanceCost' },
      },
    },
    {
      $lookup: {
        from: 'fleets',
        localField: '_id',
        foreignField: '_id',
        as: 'fleet',
      },
    },
    { $unwind: { path: '$fleet', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        fleetName: { $ifNull: ['$fleet.name', 'Unassigned'] },
        vehicleCount: 1,
        activeVehicles: 1,
        maintenanceVehicles: 1,
        totalMaintenanceCost: 1,
      },
    },
  ]);

  successResponse(res, { fleetStats });
});
