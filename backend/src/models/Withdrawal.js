import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    bankDetails: {
      bankName: { type: String, required: true },
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    adminNote: String,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    transferReference: String,
    transferCode: String,
  },
  { timestamps: true }
);

withdrawalSchema.index({ rider: 1, status: 1, createdAt: -1 });

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
