import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['shipment_update', 'payment', 'system', 'promotion', 'alert', 'message'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    // Related entities
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

    // Deep link / action
    actionUrl: String,
    actionLabel: String,

    // Status
    isRead: { type: Boolean, default: false },
    readAt: Date,

    // Delivery channels
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },

    // Delivery status
    delivered: {
      inApp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },

    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },

    expiresAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
