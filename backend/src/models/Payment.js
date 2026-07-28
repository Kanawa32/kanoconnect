import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },

    // Paystack details
    reference: { type: String, unique: true, index: true },
    paystackReference: String,
    authorizationUrl: String,
    accessCode: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'abandoned', 'reversed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Payment method details
    channel: { type: String, enum: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'cash'] },
    cardType: String,
    bank: String,
    last4: String,

    // Metadata
    metadata: { type: mongoose.Schema.Types.Mixed },

    // Refund info
    refundedAmount: { type: Number, default: 0 },
    refundReason: String,

    // Fees
    paystackFees: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    paidAt: Date,
    verifiedAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
