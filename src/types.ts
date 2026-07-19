export type Role = 'user' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string;
  officeLink: string;
  officeMapLink: string;
  profileImage: string;
  walletBalance: number;
  profileComplete: boolean;
  freeMealClaimed: boolean;
  role: Role;
  createdAt: string;
}

export type MealType = 'lunch' | 'dinner';

export interface Vendor {
  id: string;
  name: string;
  logoUrl: string;
  tagline: string;
  isFeatured: boolean;
  rating: number;
}

export interface Review {
  id: string;
  orderId: string;
  vendorId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  isHidden?: boolean; // Admin moderation flag
}

export interface MenuPackage {
  id: string;
  vendorId: string;
  dayOfWeek: string; // 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  mealType: MealType;
  packageName: string; // e.g. "Chicken Feast", "Beef Polao", "Veggies & Lentils"
  items: string; // comma separated items, e.g. "Chinigura Rice, Roast Chicken, Salad, Soft Drink"
  price: number;
  discountPrice: number;
}

export type OrderStatus = 'Cooking' | 'On the way' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  packageId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mealType: MealType;
  status: OrderStatus;
  createdAt: string;
  // Included details for client joins
  vendorName?: string;
  packageName?: string;
  userName?: string;
}

export type TransactionType = 'deposit' | 'order_debit' | 'refund' | 'free_meal' | 'manual_adjustment';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  resultingBalance: number;
  gatewayRef: string;
  status: 'success' | 'failed' | 'pending';
  createdAt: string;
  memo?: string;
  userName?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userName?: string;
  userPhone?: string;
}

