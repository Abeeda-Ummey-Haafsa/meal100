import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./src/db/connect";
import { defaultUsers, defaultVendors, defaultPackages } from './src/seedData';

import {
  User,
  Vendor,
  MenuPackage,
  Order,
  Transaction,
  Review,
  Withdrawal,
} from "./src/types";

import {
  UserModel,
  VendorModel,
  MenuPackageModel,
  OrderModel,
  TransactionModel,
  ReviewModel,
  WithdrawalModel,
  OtpModel
} from "./src/db/models";

const PORT = 3000;

// Connect BEFORE starting Express


const app = express();


app.use(async (req, res, next) => {
  await connectDB();
  next();
});


app.use(express.json());


// Authentication Middleware helper
async function getAuthenticatedUser(req: express.Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return UserModel.findOne({ id: token }).lean();
}

// =================== API ENDPOINTS ===================

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
    await OtpModel.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true }
    );

    console.log(`[SMS MOCK GATEWAY] Sending OTP to ${phone}: ${otp}`);

    // Also pre-fill/return OTP in response so client can easily debug/log in without console checks
    res.json({ message: 'OTP sent successfully (mocked)', debugOTP: otp });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const record = await OtpModel.findOne({ phone }).lean();
    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    await OtpModel.deleteOne({ phone });

    let user = await UserModel.findOne({ phone });

    if (!user) {
      // Register new user with 0 balance
      user = new UserModel({
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        phone,
        name: '',
        officeLink: '',
        officeMapLink: '',
        profileImage: '',
        walletBalance: 0,
        profileComplete: false,
        freeMealClaimed: false,
        role: 'user',
        createdAt: new Date().toISOString()
      });
      await user.save();
    }

    res.json({ token: user.id, user });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Current User Info
app.get('/api/me', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }
    res.json(user);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Profile & claim Free Meal if eligible
app.put('/api/me', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { name, officeLink, officeMapLink, profileImage } = req.body;
    const dbUser = await UserModel.findOne({ id: user.id });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name !== undefined) dbUser.name = name;
    if (officeLink !== undefined) dbUser.officeLink = officeLink;
    if (officeMapLink !== undefined) dbUser.officeMapLink = officeMapLink;
    if (profileImage !== undefined) dbUser.profileImage = profileImage;

    // Check profile completeness: all fields must be filled
    const hasAllFields = !!(
      dbUser.name &&
      dbUser.phone &&
      dbUser.officeLink &&
      dbUser.officeMapLink &&
      dbUser.profileImage
    );

    if (hasAllFields) {
      dbUser.profileComplete = true;
      // Award free meal credit once: value 200 BDT
      if (!dbUser.freeMealClaimed) {
        dbUser.freeMealClaimed = true;
        const creditAmount = 200;
        dbUser.walletBalance += creditAmount;

        // Log transaction for free meal
        const txn: Transaction = {
          id: 't_free_' + Math.random().toString(36).substr(2, 9),
          userId: dbUser.id,
          type: 'free_meal',
          amount: creditAmount,
          resultingBalance: dbUser.walletBalance,
          gatewayRef: 'FREE_PROFILE_BONUS',
          status: 'success',
          createdAt: new Date().toISOString(),
          memo: 'One-time registration free meal reward'
        };
        await TransactionModel.create(txn);
      }
    } else {
      dbUser.profileComplete = false;
    }

    await dbUser.save();
    res.json(dbUser);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET list of all vendors
app.get('/api/vendors', async (req, res) => {
  const vendors = await VendorModel.find().lean();
  const reviews = await ReviewModel.find({ isHidden: false }).lean();
  const vendorsWithRatings = vendors.map(vendor => {
    const vendorReviews = reviews.filter((r: any) => r.vendorId === vendor.id);
    if (vendorReviews.length > 0) {
      const avg = vendorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / vendorReviews.length;
      return { ...vendor, rating: Math.round(avg * 10) / 10 };
    }
    return vendor;
  });
  res.json(vendorsWithRatings);
});


// GET Menu packages (with filter by vendor, day of week, meal type)
app.get('/api/menu-packages', async (req, res) => {
  try {
    const { vendorId, day, mealType } = req.query;
    const query: Record<string, any> = {};

    if (vendorId) query.vendorId = vendorId;
    if (day) query.dayOfWeek = { $regex: new RegExp(`^${day as string}$`, 'i') };
    if (mealType) query.mealType = mealType;

    const pkgs = await MenuPackageModel.find(query).lean();
    res.json(pkgs);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET My Orders or All Orders (if Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders = user.role === 'admin'
      ? await OrderModel.find().lean()
      : await OrderModel.find({ userId: user.id }).lean();

    const vendorIds = [...new Set(orders.map((o: Order) => o.vendorId))];
    const packageIds = [...new Set(orders.map((o: Order) => o.packageId))];
    const userIds = [...new Set(orders.map((o: Order) => o.userId))];
    const orderIds = orders.map((o: Order) => o.id);

    const [vendors, packages, users, reviews] = await Promise.all([
      VendorModel.find({ id: { $in: vendorIds } }).lean(),
      MenuPackageModel.find({ id: { $in: packageIds } }).lean(),
      UserModel.find({ id: { $in: userIds } }).lean(),
      ReviewModel.find({ orderId: { $in: orderIds }, isHidden: false }).lean(),
    ]);

    const detailedOrders = orders.map((o: Order) => {
      const vendor = vendors.find((v: Vendor) => v.id === o.vendorId);
      const pkg = packages.find((p: MenuPackage) => p.id === o.packageId);
      const u = users.find((usr: User) => usr.id === o.userId);
      const review = reviews.find((r: any) => r.orderId === o.id);
      return {
        ...o,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        packageName: pkg ? pkg.packageName : 'Unknown Package',
        userName: u ? (u.name || u.phone) : 'Unknown User',
        isReviewed: !!review,
        reviewRating: review ? review.rating : undefined,
        reviewComment: review ? review.comment : undefined
      };
    });

    // Most recent first
    detailedOrders.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(detailedOrders);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PLACE AN ORDER
app.post('/api/orders', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { vendorId, packageId, quantity, mealType } = req.body;
    if (!vendorId || !packageId || !quantity || !mealType) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    if (quantity < 5) {
      return res.status(400).json({ error: 'Minimum order quantity is 5 meals' });
    }

    const session = await UserModel.db.startSession();
    try {
      session.startTransaction();

      const dbUser = await UserModel.findOne({ id: user.id }).session(session);
      if (!dbUser) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'User account not found' });
      }

      const pkg = await MenuPackageModel.findOne({ id: packageId }).session(session);
      if (!pkg) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Selected Menu Package not found' });
      }

      const unitPrice = pkg.discountPrice || pkg.price;
      const totalPrice = unitPrice * quantity;

      // STRICT RULE CHECK: wallet_balance >= order_total
      if (dbUser.walletBalance < totalPrice) {
        await session.abortTransaction();
        return res.status(400).json({
          error: `Insufficient balance — you need ৳${totalPrice - dbUser.walletBalance} more to place this order`,
          requiresDeposit: totalPrice - dbUser.walletBalance
        });
      }

      // Deduct from wallet balance
      dbUser.walletBalance -= totalPrice;

      // Create Order
      const order: Order = {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        vendorId,
        packageId,
        quantity,
        unitPrice,
        totalPrice,
        mealType,
        status: 'Cooking',
        createdAt: new Date().toISOString()
      };

      // Create Debit Transaction
      const txn: Transaction = {
        id: 'txn_' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        type: 'order_debit',
        amount: -totalPrice,
        resultingBalance: dbUser.walletBalance,
        gatewayRef: order.id,
        status: 'success',
        createdAt: new Date().toISOString(),
        memo: `Ordered ${quantity}x ${pkg.packageName}`
      };

      await dbUser.save({ session });
      await OrderModel.create([order], { session });
      await TransactionModel.create([txn], { session });

      await session.commitTransaction();

      res.json({ success: true, order, resultingBalance: dbUser.walletBalance });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CANCEL OWN ORDER (If status is Cooking) OR UPDATE ORDER STATUS (Admin only)
app.post('/api/orders/:id/status', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body; // 'Cooking' | 'On the way' | 'Delivered' | 'Cancelled'

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const session = await UserModel.db.startSession();
    try {
      session.startTransaction();

      const order = await OrderModel.findOne({ id }).session(session);

      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Order not found' });
      }

      // Logic boundaries:
      // If user is NOT admin, they can only Cancel order, and only if status is currently Cooking
      if (user.role !== 'admin') {
        if (status !== 'Cancelled') {
          await session.abortTransaction();
          return res.status(403).json({ error: 'Forbidden: Only admin can advance order states' });
        }
        if (order.userId !== user.id) {
          await session.abortTransaction();
          return res.status(403).json({ error: 'Forbidden: You do not own this order' });
        }
        if (order.status !== 'Cooking') {
          await session.abortTransaction();
          return res.status(400).json({ error: 'Cannot cancel order once it is cooking/on the way' });
        }
      }

      const prevStatus = order.status;
      order.status = status;

      // refund auto trigger if status becomes Cancelled
      if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
        const refundUser = await UserModel.findOne({ id: order.userId }).session(session);
        if (refundUser) {
          refundUser.walletBalance += order.totalPrice;

          const refundTxn: Transaction = {
            id: 'txn_ref_' + Math.random().toString(36).substr(2, 9),
            userId: refundUser.id,
            type: 'refund',
            amount: order.totalPrice,
            resultingBalance: refundUser.walletBalance,
            gatewayRef: order.id,
            status: 'success',
            createdAt: new Date().toISOString(),
            memo: `Refund for Cancelled Order ${order.id}`
          };
          await refundUser.save({ session });
          await TransactionModel.create([refundTxn], { session });
        }
      }

      await order.save({ session });
      await session.commitTransaction();
      res.json({ success: true, order });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MOCK DEPOSIT
app.post('/api/deposit', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { amount } = req.body;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount < 1000) {
      return res.status(400).json({ error: 'Minimum deposit amount is ৳1000' });
    }

    const session = await UserModel.db.startSession();
    try {
      session.startTransaction();

      const dbUser = await UserModel.findOne({ id: user.id }).session(session);

      if (!dbUser) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'User account not found' });
      }

      // Credit user balance
      dbUser.walletBalance += depositAmount;

      // Add Transaction
      const refNum = 'DEP_' + Math.floor(1000000 + Math.random() * 9000000);
      const txn: Transaction = {
        id: 'txn_' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        type: 'deposit',
        amount: depositAmount,
        resultingBalance: dbUser.walletBalance,
        gatewayRef: refNum,
        status: 'success',
        createdAt: new Date().toISOString(),
        memo: 'Online Wallet Deposit (bKash/Nagad)'
      };

      await dbUser.save({ session });
      await TransactionModel.create([txn], { session });
      await session.commitTransaction();

      res.json({ success: true, resultingBalance: dbUser.walletBalance, transaction: txn });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET My Transactions or All Transactions (if Admin)
app.get('/api/transactions', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const txns = user.role === 'admin'
      ? await TransactionModel.find().lean()
      : await TransactionModel.find({ userId: user.id }).lean();

    const userIds = [...new Set(txns.map((t: Transaction) => t.userId))];
    const users = await UserModel.find({ id: { $in: userIds } }).lean();

    // Inject username for admin dashboard readability
    const detailedTxns = txns.map((t: Transaction) => {
      const u = users.find((usr: User) => usr.id === t.userId);
      return {
        ...t,
        userName: u ? (u.name || u.phone) : 'Unknown User'
      };
    });

    // Sort by date descending
    detailedTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(detailedTxns);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== ADMIN SPECIFIC ENDPOINTS ===================

// GET list of users (Admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }
    const users = await UserModel.find().lean();
    res.json(users);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE / UPDATE Vendor (Admin only)
app.post('/api/admin/vendors', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id, name, logoUrl, tagline, isFeatured, rating } = req.body;
    if (!name || !logoUrl || !tagline) {
      return res.status(400).json({ error: 'Name, logo, and tagline are required' });
    }

    if (id) {
      // Update existing
      const vendor = await VendorModel.findOne({ id });
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      vendor.id = id;
      vendor.name = name;
      vendor.logoUrl = logoUrl;
      vendor.tagline = tagline;
      vendor.isFeatured = !!isFeatured;
      vendor.rating = rating || 4.5;
      await vendor.save();
    } else {
      // Create new
      const newVendor = new VendorModel({
        id: 'v_' + Math.random().toString(36).substr(2, 9),
        name,
        logoUrl,
        tagline,
        isFeatured: !!isFeatured,
        rating: rating || 4.5
      });
      await newVendor.save();
    }

    const vendors = await VendorModel.find().lean();
    res.json({ success: true, vendors });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE Vendor (Admin only)
app.delete('/api/admin/vendors/:id', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id } = req.params;

    await VendorModel.deleteOne({ id });
    // Clean up its packages too
    await MenuPackageModel.deleteMany({ vendorId: id });

    res.json({ success: true });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE / UPDATE Menu Package (Admin only)
app.post('/api/admin/menu-packages', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id, vendorId, dayOfWeek, mealType, packageName, items, price, discountPrice } = req.body;
    if (!vendorId || !dayOfWeek || !mealType || !packageName || !items || !price) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newPackageData = {
      id: id || 'pkg_' + Math.random().toString(36).substr(2, 9),
      vendorId,
      dayOfWeek,
      mealType,
      packageName,
      items,
      price: Number(price),
      discountPrice: Number(discountPrice) || Number(price)
    };

    if (id) {
      const existingPackage = await MenuPackageModel.findOne({ id });
      if (!existingPackage) return res.status(404).json({ error: 'Package not found' });
      existingPackage.id = newPackageData.id;
      existingPackage.vendorId = vendorId;
      existingPackage.dayOfWeek = dayOfWeek;
      existingPackage.mealType = mealType;
      existingPackage.packageName = packageName;
      existingPackage.items = items;
      existingPackage.price = Number(price);
      existingPackage.discountPrice = Number(discountPrice) || Number(price);
      await existingPackage.save();
    } else {
      const newPackage = new MenuPackageModel(newPackageData);
      await newPackage.save();
    }

    const packages = await MenuPackageModel.find().lean();
    res.json({ success: true, packages });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE Menu Package (Admin only)
app.delete('/api/admin/menu-packages/:id', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id } = req.params;
    await MenuPackageModel.deleteOne({ id });
    res.json({ success: true });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// MANUAL ADJUST BALANCE WITH AUDIT LOG (Admin only)
app.post('/api/admin/adjust-balance', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { userId, amount, memo } = req.body;
    const adjustmentAmount = parseFloat(amount);

    if (!userId || isNaN(adjustmentAmount)) {
      return res.status(400).json({ error: 'UserId and valid adjustment amount are required' });
    }

    const dbUser = await UserModel.findOne({ id: userId });

    if (!dbUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Apply adjustment
    dbUser.walletBalance += adjustmentAmount;

    // Log transaction
    const txn: Transaction = {
      id: 'txn_adj_' + Math.random().toString(36).substr(2, 9),
      userId: dbUser.id,
      type: 'manual_adjustment',
      amount: adjustmentAmount,
      resultingBalance: dbUser.walletBalance,
      gatewayRef: 'ADMIN_MANUAL_ADJUST',
      status: 'success',
      createdAt: new Date().toISOString(),
      memo: memo || `Balance adjusted manually by administrator`
    };

    await dbUser.save();
    await TransactionModel.create(txn);

    res.json({ success: true, targetUser: dbUser });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET reviews for a vendor (public reviews only)
app.get('/api/reviews', async (req, res) => {
  try {
    const { vendorId } = req.query;
    const query: Record<string, any> = { isHidden: false };
    if (vendorId) {
      query.vendorId = vendorId;
    }

    const reviews = await ReviewModel.find(query).lean();

    // Sort by created date descending
    reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(reviews);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SUBMIT a review (requires user to be authenticated)
app.post('/api/reviews', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { orderId, vendorId, rating, comment } = req.body;
    if (!orderId || !vendorId || !rating || comment === undefined) {
      return res.status(400).json({ error: 'orderId, vendorId, rating, and comment are required' });
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Verify order exists, belongs to user, and is 'Delivered'
    const order = await OrderModel.findOne({ id: orderId }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only review your own orders' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'You can only review delivered orders' });
    }

    // Check if order already reviewed
    const existingReview = await ReviewModel.findOne({ orderId }).lean();
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this order' });
    }

    const newReview: Review = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      orderId,
      vendorId,
      userId: user.id,
      userName: user.name || user.phone,
      rating: ratingVal,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      isHidden: false
    };

    await ReviewModel.create(newReview);

    res.json({ success: true, review: newReview });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET all reviews for Admin Moderation (Admin only)
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const reviews = await ReviewModel.find().lean();
    const vendorIds = [...new Set(reviews.map((r: any) => r.vendorId))];
    const vendors = await VendorModel.find({ id: { $in: vendorIds } }).lean();

    // Join vendor name for easy reading in admin moderation list
    const detailedReviews = reviews.map((r: any) => {
      const vendor = vendors.find((v: Vendor) => v.id === r.vendorId);
      return {
        ...r,
        vendorName: vendor ? vendor.name : 'Unknown Vendor'
      };
    });

    // Sort by created date descending
    detailedReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(detailedReviews);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// TOGGLE HIDE/SHOW review (Admin only)
app.post('/api/admin/reviews/:id/toggle-hide', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id } = req.params;
    const review = await ReviewModel.findOne({ id });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    res.json({ success: true, review });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE review (Admin only)
app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id } = req.params;
    const result = await ReviewModel.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== WITHDRAWAL ENDPOINTS ===================

// GET Withdrawals (Admin gets all, user gets own)
app.get('/api/withdrawals', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const withdrawals = user.role === 'admin'
      ? await WithdrawalModel.find().lean()
      : await WithdrawalModel.find({ userId: user.id }).lean();

    const userIds = [...new Set(withdrawals.map((w: Withdrawal) => w.userId))];
    const users = await UserModel.find({ id: { $in: userIds } }).lean();

    // Join user info for readability
    const detailedWithdrawals = withdrawals.map((w: Withdrawal) => {
      const u = users.find((usr: User) => usr.id === w.userId);
      return {
        ...w,
        userName: u ? (u.name || u.phone) : 'Unknown User',
        userPhone: u ? u.phone : 'Unknown Phone'
      };
    });

    // Sort by date descending
    detailedWithdrawals.sort((a: Withdrawal, b: Withdrawal) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(detailedWithdrawals);
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SUBMIT withdrawal request
app.post('/api/withdrawals', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Withdrawal reason is required' });
    }

    const session = await UserModel.db.startSession();
    try {
      session.startTransaction();

      const dbUser = await UserModel.findOne({ id: user.id }).session(session);
      if (!dbUser) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'User account not found' });
      }

      // Check for existing pending withdrawal
      const existingPending = await WithdrawalModel.findOne({ userId: dbUser.id, status: 'pending' }).session(session);
      if (existingPending) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'You already have a pending withdrawal request' });
      }

      const currentBal = dbUser.walletBalance;
      if (currentBal <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ error: 'You do not have any balance to withdraw' });
      }

      // Deduct balance to 0
      dbUser.walletBalance = 0;

      const withdrawalId = 'wd_' + Math.random().toString(36).substr(2, 9);
      const newWithdrawal: Withdrawal = {
        id: withdrawalId,
        userId: dbUser.id,
        amount: currentBal,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Create pending transaction in ledger
      const txn: Transaction = {
        id: 'txn_' + Math.random().toString(36).substr(2, 9),
        userId: dbUser.id,
        type: 'manual_adjustment',
        amount: -currentBal,
        resultingBalance: 0,
        gatewayRef: withdrawalId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        memo: `Withdrawal Pending Request: ${reason.trim()}`
      };

      await dbUser.save({ session });
      await WithdrawalModel.create([newWithdrawal], { session });
      await TransactionModel.create([txn], { session });
      await session.commitTransaction();

      res.json({ success: true, user: dbUser, withdrawal: newWithdrawal, transaction: txn });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN APPROVE / REJECT withdrawal (Admin only)
app.post('/api/admin/withdrawals/:id/status', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin role required' });
    }

    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const session = await UserModel.db.startSession();
    try {
      session.startTransaction();

      const withdrawal = await WithdrawalModel.findOne({ id }).session(session);

      if (!withdrawal) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'Withdrawal request not found' });
      }

      if (withdrawal.status !== 'pending') {
        await session.abortTransaction();
        return res.status(400).json({ error: 'Withdrawal request has already been processed' });
      }

      withdrawal.status = status;

      // Find corresponding pending transaction in ledger
      const txn = await TransactionModel.findOne({ gatewayRef: id, status: 'pending' }).session(session);

      if (status === 'approved') {
        if (txn) {
          txn.status = 'success';
          txn.memo = `Withdrawal Approved: ${withdrawal.reason}`;
          await txn.save({ session });
        }
      } else {
        // Rejected: Refund user
        if (txn) {
          txn.status = 'failed';
          txn.memo = `Withdrawal Rejected: ${withdrawal.reason}`;
          await txn.save({ session });
        }

        const refundUser = await UserModel.findOne({ id: withdrawal.userId }).session(session);
        if (refundUser) {
          refundUser.walletBalance += withdrawal.amount;

          // Log a refund transaction to restore the ledger balance
          const refundTxn: Transaction = {
            id: 'txn_ref_' + Math.random().toString(36).substr(2, 9),
            userId: refundUser.id,
            type: 'refund',
            amount: withdrawal.amount,
            resultingBalance: refundUser.walletBalance,
            gatewayRef: id,
            status: 'success',
            createdAt: new Date().toISOString(),
            memo: `Refund for Rejected Withdrawal: ${withdrawal.reason}`
          };
          await refundUser.save({ session });
          await TransactionModel.create([refundTxn], { session });
        }
      }

      await withdrawal.save({ session });
      await session.commitTransaction();
      res.json({ success: true, withdrawal });
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =================== VITE SERVING & RUNTIME ===================

// async function startServer() {
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: "spa",
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), 'dist');
//     app.use(express.static(distPath));
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'));
//     });
//   }

//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`[Meal100] Full-Stack server running on http://localhost:${PORT}`);
//   });
// }

// startServer();
async function startServer() {
  if (process.env.VERCEL) {
    // On Vercel: no listen(), no Vite middleware, no static serving —
    // vercel.json rewrites already handle the frontend + this file is
    // wrapped as a serverless function via api/index.ts
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Meal100] Full-Stack server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
