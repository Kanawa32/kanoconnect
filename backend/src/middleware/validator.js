import { body, param, query, validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    return next(new ApiError(400, extractedErrors.map(e => e.message).join('; '), true, null));
  };
};

// Auth validators
export const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('role').not().exists().withMessage('Role selection is not allowed on registration'),
];

export const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Shipment validators
export const createShipmentValidator = [
  body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
  body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
  body('pickupDate').isISO8601().withMessage('Valid pickup date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.weight').isFloat({ min: 0 }).withMessage('Weight must be positive'),
  body('serviceType').optional().isIn(['standard', 'express', 'same_day', 'scheduled']),
];

// Vehicle validators
export const createVehicleValidator = [
  body('name').trim().notEmpty().withMessage('Vehicle name is required'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('type').isIn(['motorcycle', 'bicycle', 'car', 'van', 'truck', 'pickup', 'bus']).withMessage('Invalid vehicle type'),
];

// Pagination validator
export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().trim(),
  query('search').optional().trim(),
];
