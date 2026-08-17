import mongoose from 'mongoose';

const paymentAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  sortCode: String,
  isActive: { type: Boolean, default: true },
  setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const PaymentAccount = mongoose.model('PaymentAccount', paymentAccountSchema);
export default PaymentAccount;
