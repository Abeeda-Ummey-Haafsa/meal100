// src/db/models.ts
import mongoose, { Schema, model } from 'mongoose';

const { models } = mongoose;

/* =========================
   User
========================= */
const UserSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  name: String,
  officeLink: String,
  officeMapLink: String,
  profileImage: String,
  walletBalance: {
    type: Number,
    default: 0,
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  freeMealClaimed: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: String,
});

export const UserModel = models.User || model('User', UserSchema);

/* =========================
   Vendor
========================= */
const VendorSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  name: String,
  logoUrl: String,
  tagline: String,
  isFeatured: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    default: 0,
  },
});

export const VendorModel = models.Vendor || model('Vendor', VendorSchema);

/* =========================
   Review
========================= */
const ReviewSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  orderId: String,
  vendorId: String,
  userId: String,
  userName: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: String,
  createdAt: String,
  isHidden: {
    type: Boolean,
    default: false,
  },
});

export const ReviewModel = models.Review || model('Review', ReviewSchema);

/* =========================
   Menu Package
========================= */
const MenuPackageSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  vendorId: String,
  dayOfWeek: {
    type: String,
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  },
  mealType: {
    type: String,
    enum: ['lunch', 'dinner'],
  },
  packageName: String,
  items: String,
  price: Number,
  discountPrice: Number,
});

export const MenuPackageModel = models.MenuPackage || model('MenuPackage', MenuPackageSchema);

/* =========================
   Order
========================= */
const OrderSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  userId: String,
  vendorId: String,
  packageId: String,
  quantity: Number,
  unitPrice: Number,
  totalPrice: Number,
  mealType: {
    type: String,
    enum: ['lunch', 'dinner'],
  },
  status: {
    type: String,
    enum: ['Cooking', 'On the way', 'Delivered', 'Cancelled'],
    default: 'Cooking',
  },
  createdAt: String,

  // Cached fields
  vendorName: String,
  packageName: String,
  userName: String,
});

export const OrderModel = models.Order || model('Order', OrderSchema);

/* =========================
   Transaction
========================= */
const TransactionSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  userId: String,
  type: {
    type: String,
    enum: [
      'deposit',
      'order_debit',
      'refund',
      'free_meal',
      'manual_adjustment',
    ],
  },
  amount: Number,
  resultingBalance: Number,
  gatewayRef: String,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
  },
  createdAt: String,
  memo: String,
  userName: String,
});

export const TransactionModel = models.Transaction || model('Transaction', TransactionSchema);

/* =========================
   Withdrawal
========================= */
const WithdrawalSchema = new Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  userId: String,
  amount: Number,
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  createdAt: String,
  userName: String,
  userPhone: String,
});

export const WithdrawalModel = models.Withdrawal || model('Withdrawal', WithdrawalSchema);

/* =========================
   OTP
========================= */
const OtpSchema = new Schema({
  phone: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
});

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-deletes expired OTPs

export const OtpModel = models.Otp || model('Otp', OtpSchema);