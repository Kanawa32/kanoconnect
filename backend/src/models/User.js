import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: {
      type: String,
      enum: ['customer', 'rider', 'dispatcher', 'admin', 'super_admin'],
      default: 'customer',
    },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
    lastLogin: { type: Date },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: 'Nigeria' },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    // Rider specific fields
    riderProfile: {
      licenseNumber: String,
      licenseExpiry: Date,
      vehicleAssigned: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
      rating: { type: Number, default: 0, min: 0, max: 5 },
      totalDeliveries: { type: Number, default: 0 },
      currentLocation: {
        lat: Number,
        lng: Number,
        lastUpdated: Date,
      },
      isOnline: { type: Boolean, default: false },
      documents: {
        idCard: String,
        driverLicense: String,
        insurance: String,
      },
    },
    // Customer specific
    customerProfile: {
      companyName: String,
      preferences: {
        defaultPickupAddress: String,
        defaultDeliveryAddress: String,
        notificationPreferences: {
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
        },
      },
    },
    // Admin/Dispatcher specific
    adminProfile: {
      department: String,
      permissions: [String],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'riderProfile.isOnline': 1 });
userSchema.index({ 'riderProfile.currentLocation': '2dsphere' });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

const User = mongoose.model('User', userSchema);
export default User;
