import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['warehouse', 'distribution_center', 'pickup_point', 'drop_off'], required: true },

    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'Nigeria' },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    contact: {
      phone: String,
      email: String,
      manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    capacity: {
      maxShipments: { type: Number, default: 1000 },
      currentShipments: { type: Number, default: 0 },
      storageArea: Number, // in sq meters
    },

    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } },
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'full', 'maintenance'],
      default: 'active',
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hubSchema.index({ 'address.city': 1, 'address.state': 1 });
hubSchema.index({ 'address.coordinates': '2dsphere' });

const Hub = mongoose.model('Hub', hubSchema);
export default Hub;
