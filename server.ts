import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { User, Vendor, MenuPackage, Order, Transaction, OrderStatus, MealType, TransactionType, Review, Withdrawal } from './src/types';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// In-memory OTP storage: phone -> { otp, expiresAt }
const otps: Record<string, { otp: string; expiresAt: number }> = {};

// Default seeding data
const defaultVendors: Vendor[] = [
  { id: 'v1', name: "Sultan's Dine", logoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60", tagline: "Dhaka's Legendary Kacchi Biryani & Borhani", isFeatured: true, rating: 4.9 },
  { id: 'v2', name: "Kacchi Bhai", logoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=60", tagline: "Basmati Kacchi with Mustard Oil & Real Spices", isFeatured: true, rating: 4.8 },
  { id: 'v3', name: "Green Kitchen", logoUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&auto=format&fit=crop&q=60", tagline: "Healthy, Diet-Friendly Balanced Corporate Meals", isFeatured: true, rating: 4.7 },
  { id: 'v4', name: "Dhaka Catering", logoUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&auto=format&fit=crop&q=60", tagline: "Authentic Home-style Polao, Curries & Lentils", isFeatured: false, rating: 4.6 },
  { id: 'v5', name: "Tehari Ghar", logoUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=120&auto=format&fit=crop&q=60", tagline: "Spicy Beef Tehari made with original Mustard Oil", isFeatured: false, rating: 4.5 },
];

const defaultPackages: MenuPackage[] = [];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes: MealType[] = ['lunch', 'dinner'];

// Helper to seed a robust, comprehensive weekly menu database
defaultVendors.forEach((vendor) => {
  days.forEach((day) => {
    mealTypes.forEach((mealType) => {
      // Create 3 packages for this vendor-day-meal combination
      defaultPackages.push({
        id: `p-${vendor.id}-${day.toLowerCase()}-${mealType}-a`,
        vendorId: vendor.id,
        dayOfWeek: day,
        mealType: mealType,
        packageName: `${mealType === 'lunch' ? 'Classic' : 'Premium'} Box A`,
        items: vendor.id === 'v1' || vendor.id === 'v2' 
          ? "Special Basmati Kacchi, Shami Kabab, Jall Borhani, Chutney" 
          : "Chinigura Rice, Roast Chicken, Mixed Veggies, Thick Lentils",
        price: 240,
        discountPrice: 199,
      });

      defaultPackages.push({
        id: `p-${vendor.id}-${day.toLowerCase()}-${mealType}-b`,
        vendorId: vendor.id,
        dayOfWeek: day,
        mealType: mealType,
        packageName: `${mealType === 'lunch' ? 'Delight' : 'Royal'} Box B`,
        items: vendor.id === 'v5'
          ? "Mustard Oil Beef Tehari, Egg Curry, Cucumber Salad, Soft Drink"
          : "Basmati Rice, Beef Bhuna, Egg Curry, Potato Bhorti, Dal",
        price: 280,
        discountPrice: 239,
      });

      defaultPackages.push({
        id: `p-${vendor.id}-${day.toLowerCase()}-${mealType}-c`,
        vendorId: vendor.id,
        dayOfWeek: day,
        mealType: mealType,
        packageName: "Healthy Fitness Box C",
        items: "Brown Rice, Grilled Chicken Breast, Sauteed Vegetables, Egg White",
        price: 220,
        discountPrice: 180,
      });
    });
  });
});

const defaultUsers: User[] = [
  {
    id: 'u1',
    phone: '01711111111',
    name: 'Meal100 Admin',
    officeLink: 'https://meal100.com',
    officeMapLink: 'https://maps.google.com',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60',
    walletBalance: 50000,
    profileComplete: true,
    freeMealClaimed: true,
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u2',
    phone: '01722222222',
    name: 'Sanjidul Islam',
    officeLink: 'https://creative-hq.com',
    officeMapLink: 'https://maps.google.com/?q=Dhanmondi,Dhaka',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60',
    walletBalance: 20000,
    profileComplete: true,
    freeMealClaimed: true,
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

// Load database
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: defaultUsers,
      vendors: defaultVendors,
      menuPackages: defaultPackages,
      orders: [] as Order[],
      transactions: [] as Transaction[],
      reviews: [] as Review[],
      withdrawals: [] as Withdrawal[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    let updated = false;
    if (!db.reviews) {
      db.reviews = [];
      updated = true;
    }
    if (!db.withdrawals) {
      db.withdrawals = [];
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    }
    return db;
  } catch (err) {
    console.error('Failed to read db, recreating...', err);
    const initialData = {
      users: defaultUsers,
      vendors: defaultVendors,
      menuPackages: defaultPackages,
      orders: [] as Order[],
      transactions: [] as Transaction[],
      reviews: [] as Review[],
      withdrawals: [] as Withdrawal[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Authentication Middleware helper
function getAuthenticatedUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const db = getDb();
  return db.users.find((u: User) => u.id === token) || null;
}

// =================== API ENDPOINTS ===================

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[phone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  };

  console.log(`[SMS MOCK GATEWAY] Sending OTP to ${phone}: ${otp}`);

  // Also pre-fill/return OTP in response so client can easily debug/log in without console checks
  res.json({ message: 'OTP sent successfully (mocked)', debugOTP: otp });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const record = otps[phone];
  if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  delete otps[phone];

  const db = getDb();
  let user = db.users.find((u: User) => u.phone === phone);

  if (!user) {
    // Register new user with 0 balance
    user = {
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
    };
    db.users.push(user);
    saveDb(db);
  }

  res.json({ token: user.id, user });
});

// Get Current User Info
app.get('/api/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }
  res.json(user);
});

// Update Profile & claim Free Meal if eligible
app.put('/api/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const { name, officeLink, officeMapLink, profileImage } = req.body;
  const db = getDb();
  const dbUser = db.users.find((u: User) => u.id === user.id);

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
      db.transactions.push(txn);
    }
  } else {
    dbUser.profileComplete = false;
  }

  saveDb(db);
  res.json(dbUser);
});

// GET list of all vendors
app.get('/api/vendors', (req, res) => {
  const db = getDb();
  const vendorsWithRatings = db.vendors.map((vendor: Vendor) => {
    const vendorReviews = (db.reviews || []).filter((r: any) => r.vendorId === vendor.id && !r.isHidden);
    if (vendorReviews.length > 0) {
      const avg = vendorReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / vendorReviews.length;
      return { ...vendor, rating: Math.round(avg * 10) / 10 };
    }
    return vendor;
  });
  res.json(vendorsWithRatings);
});

// GET Menu packages (with filter by vendor, day of week, meal type)
app.get('/api/menu-packages', (req, res) => {
  const { vendorId, day, mealType } = req.query;
  const db = getDb();
  let pkgs = db.menuPackages;

  if (vendorId) pkgs = pkgs.filter((p: MenuPackage) => p.vendorId === vendorId);
  if (day) pkgs = pkgs.filter((p: MenuPackage) => p.dayOfWeek.toLowerCase() === (day as string).toLowerCase());
  if (mealType) pkgs = pkgs.filter((p: MenuPackage) => p.mealType === mealType);

  res.json(pkgs);
});

// GET My Orders or All Orders (if Admin)
app.get('/api/orders', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  let orders = db.orders;

  if (user.role !== 'admin') {
    orders = orders.filter((o: Order) => o.userId === user.id);
  }

  // Join vendor name and package details for easy rendering
  const detailedOrders = orders.map((o: Order) => {
    const vendor = db.vendors.find((v: Vendor) => v.id === o.vendorId);
    const pkg = db.menuPackages.find((p: MenuPackage) => p.id === o.packageId);
    const u = db.users.find((usr: User) => usr.id === o.userId);
    const review = (db.reviews || []).find((r: any) => r.orderId === o.id);
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
});

// PLACE AN ORDER
app.post('/api/orders', (req, res) => {
  const user = getAuthenticatedUser(req);
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

  const db = getDb();
  const dbUser = db.users.find((u: User) => u.id === user.id);
  if (!dbUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  const pkg = db.menuPackages.find((p: MenuPackage) => p.id === packageId);
  if (!pkg) {
    return res.status(404).json({ error: 'Selected Menu Package not found' });
  }

  const unitPrice = pkg.discountPrice || pkg.price;
  const totalPrice = unitPrice * quantity;

  // STRICT RULE CHECK: wallet_balance >= order_total
  if (dbUser.walletBalance < totalPrice) {
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

  db.orders.push(order);
  db.transactions.push(txn);

  saveDb(db);

  res.json({ success: true, order, resultingBalance: dbUser.walletBalance });
});

// CANCEL OWN ORDER (If status is Cooking) OR UPDATE ORDER STATUS (Admin only)
app.post('/api/orders/:id/status', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  const { status } = req.body; // 'Cooking' | 'On the way' | 'Delivered' | 'Cancelled'

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const db = getDb();
  const orderIndex = db.orders.findIndex((o: Order) => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = db.orders[orderIndex];

  // Logic boundaries:
  // If user is NOT admin, they can only Cancel order, and only if status is currently Cooking
  if (user.role !== 'admin') {
    if (status !== 'Cancelled') {
      return res.status(403).json({ error: 'Forbidden: Only admin can advance order states' });
    }
    if (order.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not own this order' });
    }
    if (order.status !== 'Cooking') {
      return res.status(400).json({ error: 'Cannot cancel order once it is cooking/on the way' });
    }
  }

  const prevStatus = order.status;
  order.status = status;

  // refund auto trigger if status becomes Cancelled
  if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
    const refundUser = db.users.find((u: User) => u.id === order.userId);
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
      db.transactions.push(refundTxn);
    }
  }

  saveDb(db);
  res.json({ success: true, order });
});

// MOCK DEPOSIT
app.post('/api/deposit', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const { amount } = req.body;
  const depositAmount = parseFloat(amount);

  if (isNaN(depositAmount) || depositAmount < 1000) {
    return res.status(400).json({ error: 'Minimum deposit amount is ৳1000' });
  }

  const db = getDb();
  const dbUser = db.users.find((u: User) => u.id === user.id);

  if (!dbUser) {
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

  db.transactions.push(txn);
  saveDb(db);

  res.json({ success: true, resultingBalance: dbUser.walletBalance, transaction: txn });
});

// GET My Transactions or All Transactions (if Admin)
app.get('/api/transactions', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getDb();
  let txns = db.transactions;

  if (user.role !== 'admin') {
    txns = txns.filter((t: Transaction) => t.userId === user.id);
  }

  // Inject username for admin dashboard readability
  const detailedTxns = txns.map((t: Transaction) => {
    const u = db.users.find((usr: User) => usr.id === t.userId);
    return {
      ...t,
      userName: u ? (u.name || u.phone) : 'Unknown User'
    };
  });

  // Sort by date descending
  detailedTxns.sort((a: Transaction, b: Transaction) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(detailedTxns);
});

// =================== ADMIN SPECIFIC ENDPOINTS ===================

// GET list of users (Admin only)
app.get('/api/admin/users', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  const db = getDb();
  res.json(db.users);
});

// CREATE / UPDATE Vendor (Admin only)
app.post('/api/admin/vendors', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id, name, logoUrl, tagline, isFeatured, rating } = req.body;
  if (!name || !logoUrl || !tagline) {
    return res.status(400).json({ error: 'Name, logo, and tagline are required' });
  }

  const db = getDb();

  if (id) {
    // Update existing
    const index = db.vendors.findIndex((v: Vendor) => v.id === id);
    if (index === -1) return res.status(404).json({ error: 'Vendor not found' });
    db.vendors[index] = { id, name, logoUrl, tagline, isFeatured: !!isFeatured, rating: rating || 4.5 };
  } else {
    // Create new
    const newVendor: Vendor = {
      id: 'v_' + Math.random().toString(36).substr(2, 9),
      name,
      logoUrl,
      tagline,
      isFeatured: !!isFeatured,
      rating: rating || 4.5
    };
    db.vendors.push(newVendor);
  }

  saveDb(db);
  res.json({ success: true, vendors: db.vendors });
});

// DELETE Vendor (Admin only)
app.delete('/api/admin/vendors/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const db = getDb();

  db.vendors = db.vendors.filter((v: Vendor) => v.id !== id);
  // Clean up its packages too
  db.menuPackages = db.menuPackages.filter((p: MenuPackage) => p.vendorId !== id);

  saveDb(db);
  res.json({ success: true });
});

// CREATE / UPDATE Menu Package (Admin only)
app.post('/api/admin/menu-packages', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id, vendorId, dayOfWeek, mealType, packageName, items, price, discountPrice } = req.body;
  if (!vendorId || !dayOfWeek || !mealType || !packageName || !items || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = getDb();

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
    const index = db.menuPackages.findIndex((p: MenuPackage) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Package not found' });
    db.menuPackages[index] = newPackageData;
  } else {
    db.menuPackages.push(newPackageData);
  }

  saveDb(db);
  res.json({ success: true, packages: db.menuPackages });
});

// DELETE Menu Package (Admin only)
app.delete('/api/admin/menu-packages/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const db = getDb();

  db.menuPackages = db.menuPackages.filter((p: MenuPackage) => p.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// MANUAL ADJUST BALANCE WITH AUDIT LOG (Admin only)
app.post('/api/admin/adjust-balance', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { userId, amount, memo } = req.body;
  const adjustmentAmount = parseFloat(amount);

  if (!userId || isNaN(adjustmentAmount)) {
    return res.status(400).json({ error: 'UserId and valid adjustment amount are required' });
  }

  const db = getDb();
  const dbUser = db.users.find((u: User) => u.id === userId);

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

  db.transactions.push(txn);
  saveDb(db);

  res.json({ success: true, targetUser: dbUser });
});

// GET reviews for a vendor (public reviews only)
app.get('/api/reviews', (req, res) => {
  const { vendorId } = req.query;
  const db = getDb();
  let reviews = db.reviews || [];

  if (vendorId) {
    reviews = reviews.filter((r: any) => r.vendorId === vendorId && !r.isHidden);
  } else {
    reviews = reviews.filter((r: any) => !r.isHidden);
  }

  // Sort by created date descending
  reviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(reviews);
});

// SUBMIT a review (requires user to be authenticated)
app.post('/api/reviews', (req, res) => {
  const user = getAuthenticatedUser(req);
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

  const db = getDb();

  // Verify order exists, belongs to user, and is 'Delivered'
  const order = db.orders.find((o: Order) => o.id === orderId);
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
  const existingReview = (db.reviews || []).find((r: any) => r.orderId === orderId);
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

  if (!db.reviews) {
    db.reviews = [];
  }
  db.reviews.push(newReview);
  saveDb(db);

  res.json({ success: true, review: newReview });
});

// GET all reviews for Admin Moderation (Admin only)
app.get('/api/admin/reviews', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const db = getDb();
  const reviews = db.reviews || [];

  // Join vendor name for easy reading in admin moderation list
  const detailedReviews = reviews.map((r: any) => {
    const vendor = db.vendors.find((v: Vendor) => v.id === r.vendorId);
    return {
      ...r,
      vendorName: vendor ? vendor.name : 'Unknown Vendor'
    };
  });

  // Sort by created date descending
  detailedReviews.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(detailedReviews);
});

// TOGGLE HIDE/SHOW review (Admin only)
app.post('/api/admin/reviews/:id/toggle-hide', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const db = getDb();
  
  const review = (db.reviews || []).find((r: any) => r.id === id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.isHidden = !review.isHidden;
  saveDb(db);

  res.json({ success: true, review });
});

// DELETE review (Admin only)
app.delete('/api/admin/reviews/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const db = getDb();

  if (!db.reviews) db.reviews = [];
  const initialLength = db.reviews.length;
  db.reviews = db.reviews.filter((r: any) => r.id !== id);

  if (db.reviews.length === initialLength) {
    return res.status(404).json({ error: 'Review not found' });
  }

  saveDb(db);
  res.json({ success: true });
});

// =================== WITHDRAWAL ENDPOINTS ===================

// GET Withdrawals (Admin gets all, user gets own)
app.get('/api/withdrawals', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const db = getDb();
  let withdrawals = db.withdrawals || [];

  if (user.role !== 'admin') {
    withdrawals = withdrawals.filter((w: Withdrawal) => w.userId === user.id);
  }

  // Join user info for readability
  const detailedWithdrawals = withdrawals.map((w: Withdrawal) => {
    const u = db.users.find((usr: User) => usr.id === w.userId);
    return {
      ...w,
      userName: u ? (u.name || u.phone) : 'Unknown User',
      userPhone: u ? u.phone : 'Unknown Phone'
    };
  });

  // Sort by date descending
  detailedWithdrawals.sort((a: Withdrawal, b: Withdrawal) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(detailedWithdrawals);
});

// SUBMIT withdrawal request
app.post('/api/withdrawals', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Withdrawal reason is required' });
  }

  const db = getDb();
  const dbUser = db.users.find((u: User) => u.id === user.id);
  if (!dbUser) {
    return res.status(404).json({ error: 'User account not found' });
  }

  // Check for existing pending withdrawal
  const existingPending = (db.withdrawals || []).find((w: Withdrawal) => w.userId === dbUser.id && w.status === 'pending');
  if (existingPending) {
    return res.status(400).json({ error: 'You already have a pending withdrawal request' });
  }

  const currentBal = dbUser.walletBalance;
  if (currentBal <= 0) {
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

  if (!db.withdrawals) db.withdrawals = [];
  db.withdrawals.push(newWithdrawal);
  db.transactions.push(txn);

  saveDb(db);

  res.json({ success: true, user: dbUser, withdrawal: newWithdrawal, transaction: txn });
});

// ADMIN APPROVE / REJECT withdrawal (Admin only)
app.post('/api/admin/withdrawals/:id/status', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const db = getDb();
  if (!db.withdrawals) db.withdrawals = [];
  const index = db.withdrawals.findIndex((w: Withdrawal) => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Withdrawal request not found' });
  }

  const withdrawal = db.withdrawals[index];
  if (withdrawal.status !== 'pending') {
    return res.status(400).json({ error: 'Withdrawal request has already been processed' });
  }

  withdrawal.status = status;

  // Find corresponding pending transaction in ledger
  const txn = db.transactions.find((t: Transaction) => t.gatewayRef === id && t.status === 'pending');

  if (status === 'approved') {
    if (txn) {
      txn.status = 'success';
      txn.memo = `Withdrawal Approved: ${withdrawal.reason}`;
    }
  } else {
    // Rejected: Refund user
    if (txn) {
      txn.status = 'failed';
      txn.memo = `Withdrawal Rejected: ${withdrawal.reason}`;
    }

    const refundUser = db.users.find((u: User) => u.id === withdrawal.userId);
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
      db.transactions.push(refundTxn);
    }
  }

  saveDb(db);
  res.json({ success: true, withdrawal });
});

// =================== VITE SERVING & RUNTIME ===================

async function startServer() {
  // Ensure DB gets initialized/seeded right away
  getDb();

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
