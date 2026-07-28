import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { type: String, enum: ['routine', 'repair', 'inspection', 'tire_change', 'oil_change', 'other'], required: true },
  description: String,
  cost: { type: Number, default: 0 },
  performedBy: String,
  nextDueDate: Date,
  documents: [String],
});

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['motorcycle', 'bicycle', 'car', 'van', 'truck', 'pickup', 'bus'],
      required: true,
    },
    brand: String,
    model: String,
    year: Number,
    color: String,
    capacity: {
      weight: { type: Number, default: 0 }, // in kg
      volume: { type: Number, default: 0 }, // in cubic meters
    },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'] },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive', 'retired'],
      default: 'active',
      index: true,
    },
    assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fleet: { type: mongoose.Schema.Types.ObjectId, ref: 'Fleet' },

    // Documents
    documents: {
      registration: String,
      insurance: String,
      inspection: String,
    },

    // Maintenance
    maintenanceRecords: [maintenanceRecordSchema],
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    totalMaintenanceCost: { type: Number, default: 0 },

    // Tracking
    currentLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date,
    },

    // Mileage
    currentMileage: { type: Number, default: 0 },

    // Images
    images: [String],

    // Meta
    notes: String,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

vehicleSchema.index({ status: 1, type: 1 });
vehicleSchema.index({ assignedRider: 1 });
vehicleSchema.index({ fleet: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
