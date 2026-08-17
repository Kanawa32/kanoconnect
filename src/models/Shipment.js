import mongoose from 'mongoose';

const shipmentItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true }, // in kg
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  value: { type: Number, default: 0 },
  fragile: { type: Boolean, default: false },
  category: { type: String, enum: ['document', 'parcel', 'electronics', 'food', 'medical', 'other'] },
});

const trackingEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    required: true,
  },
  location: {
    address: String,
    coordinates: { lat: Number, lng: Number },
  },
  note: String,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const shipmentSchema = new mongoose.Schema(
  {
    trackingNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    dispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Pickup details
    pickupAddress: { type: String, required: true },
    pickupCoordinates: { lat: Number, lng: Number },
    pickupContactName: String,
    pickupContactPhone: String,
    pickupDate: { type: Date, required: true },
    pickupTimeWindow: {
      start: String,
      end: String,
    },

    // Delivery details
    deliveryAddress: { type: String, required: true },
    deliveryCoordinates: { lat: Number, lng: Number },
    deliveryContactName: String,
    deliveryContactPhone: String,
    deliveryDate: Date,
    deliveryInstructions: String,

    // Items
    items: [shipmentItemSchema],
    totalWeight: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },

    // Pricing
    basePrice: { type: Number, default: 0 },
    distancePrice: { type: Number, default: 0 },
    weightPrice: { type: Number, default: 0 },
    insuranceFee: { type: Number, default: 0 },
    expressFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    riderEarnings: { type: Number, default: 0 },

    // Service type
    serviceType: { type: String, enum: ['standard', 'express', 'same_day', 'scheduled'], default: 'standard' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, enum: ['card', 'bank_transfer', 'wallet', 'cash', 'paystack'], default: 'paystack' },
    paymentReference: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true,
    },

    // Tracking
    trackingHistory: [trackingEventSchema],
    currentLocation: { lat: Number, lng: Number },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,

    // Route
    route: {
      distance: Number, // in km
      duration: Number, // in minutes
      polyline: String,
    },

    // Delivery proof
    deliveryProof: {
      signature: String,
      photo: String,
      recipientName: String,
      recipientPhone: String,
      notes: String,
    },

    // Rating
    rating: {
      score: { type: Number, min: 1, max: 5 },
      comment: String,
      createdAt: Date,
    },

    // Insurance
    insurance: {
      isInsured: { type: Boolean, default: false },
      coverageAmount: { type: Number, default: 0 },
    },

    // Notes
    internalNotes: String,
    customerNotes: String,

    // Cancellation
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Meta
    source: { type: String, enum: ['web', 'mobile', 'api', 'admin'], default: 'web' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
shipmentSchema.index({ trackingNumber: 'text', pickupAddress: 'text', deliveryAddress: 'text' });
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ customer: 1, createdAt: -1 });
shipmentSchema.index({ rider: 1, status: 1 });
shipmentSchema.index({ pickupCoordinates: '2dsphere' });
shipmentSchema.index({ deliveryCoordinates: '2dsphere' });

// Pre-save middleware to generate tracking number
shipmentSchema.pre('save', async function (next) {
  if (!this.trackingNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.trackingNumber = `KNC-${timestamp}-${random}`;
  }

  // Calculate total weight
  if (this.items && this.items.length > 0) {
    this.totalWeight = this.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    this.totalValue = this.items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
  }

  next();
});

// Add tracking event
shipmentSchema.methods.addTrackingEvent = function (event) {
  this.trackingHistory.push(event);
  this.status = event.status;
  if (event.location?.coordinates) {
    this.currentLocation = event.location.coordinates;
  }
  return this.save();
};

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
