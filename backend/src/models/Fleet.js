import mongoose from 'mongoose';

const fleetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    region: {
      city: String,
      state: String,
      country: { type: String, default: 'Nigeria' },
      coverageArea: {
        center: { lat: Number, lng: Number },
        radius: Number, // in km
      },
    },
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
    riders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Performance metrics
    metrics: {
      totalDeliveries: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      averageDeliveryTime: { type: Number, default: 0 },
      customerSatisfaction: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

fleetSchema.index({ 'region.city': 1, 'region.state': 1 });
fleetSchema.index({ manager: 1 });

const Fleet = mongoose.model('Fleet', fleetSchema);
export default Fleet;
