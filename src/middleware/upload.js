import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `kanoconnect/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: [{ quality: 'auto:good' }],
    },
  });
};

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const uploadShipmentImage = multer({
  storage: createStorage('shipments'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadVehicleImage = multer({
  storage: createStorage('vehicles'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadDocument = multer({
  storage: createStorage('documents'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadDeliveryProof = multer({
  storage: createStorage('delivery-proofs'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
