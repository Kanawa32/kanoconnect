import mongoose from 'mongoose';

const pricingSchema = new mongoose.Schema({
  basePrice: { type: Number, default: 500 },
  distanceRate: { type: Number, default: 100 },
  weightRate: { type: Number, default: 50 },
  minimumAmount: { type: Number, default: 500 },
  serviceMultipliers: {
    standard: { type: Number, default: 1.0 },
    express: { type: Number, default: 1.5 },
    same_day: { type: Number, default: 2.0 },
    scheduled: { type: Number, default: 1.2 },
  },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Pricing = mongoose.model('Pricing', pricingSchema);
export default Pricing;
