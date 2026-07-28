import { Pricing } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { successResponse } from '../utils/response.js';

export const getPricing = asyncHandler(async (req, res) => {
  let pricing = await Pricing.findOne().sort('-createdAt').lean();
  if (!pricing) {
    pricing = {
      basePrice: 500, distanceRate: 100, weightRate: 50, minimumAmount: 500,
      serviceMultipliers: { standard: 1, express: 1.5, same_day: 2, scheduled: 1.2 },
    };
  }
  successResponse(res, pricing);
});

export const updatePricing = asyncHandler(async (req, res) => {
  const { basePrice, distanceRate, weightRate, minimumAmount, serviceMultipliers } = req.body;

  if (basePrice != null && basePrice < 0) throw new ApiError(400, 'basePrice must be >= 0');
  if (distanceRate != null && distanceRate < 0) throw new ApiError(400, 'distanceRate must be >= 0');
  if (weightRate != null && weightRate < 0) throw new ApiError(400, 'weightRate must be >= 0');

  let pricing = await Pricing.findOne().sort('-createdAt');

  if (!pricing) {
    pricing = await Pricing.create({ ...req.body, setBy: req.user._id });
  } else {
    if (basePrice != null) pricing.basePrice = basePrice;
    if (distanceRate != null) pricing.distanceRate = distanceRate;
    if (weightRate != null) pricing.weightRate = weightRate;
    if (minimumAmount != null) pricing.minimumAmount = minimumAmount;
    if (serviceMultipliers) {
      if (serviceMultipliers.standard != null) pricing.serviceMultipliers.standard = serviceMultipliers.standard;
      if (serviceMultipliers.express != null) pricing.serviceMultipliers.express = serviceMultipliers.express;
      if (serviceMultipliers.same_day != null) pricing.serviceMultipliers.same_day = serviceMultipliers.same_day;
      if (serviceMultipliers.scheduled != null) pricing.serviceMultipliers.scheduled = serviceMultipliers.scheduled;
    }
    pricing.setBy = req.user._id;
    await pricing.save();
  }

  successResponse(res, pricing, 'Pricing updated');
});

export const calculatePrice = async (distance, weight, serviceType) => {
  let pricing = await Pricing.findOne().sort('-createdAt').lean();

  const basePrice = pricing?.basePrice ?? 500;
  const distanceRate = pricing?.distanceRate ?? 100;
  const weightRate = pricing?.weightRate ?? 50;
  const multipliers = pricing?.serviceMultipliers ?? { standard: 1, express: 1.5, same_day: 2, scheduled: 1.2 };

  const serviceMultiplier = multipliers[serviceType] || 1;
  const distancePrice = distance * distanceRate;
  const weightPrice = weight * weightRate;
  const total = (basePrice + distancePrice + weightPrice) * serviceMultiplier;

  return {
    basePrice,
    distancePrice,
    weightPrice,
    totalAmount: Math.round(Math.max(total, pricing?.minimumAmount ?? 500)),
  };
};
