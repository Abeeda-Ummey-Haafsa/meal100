// src/seedData.ts
import { User, Vendor, MenuPackage, MealType } from './types';

export const defaultVendors: Vendor[] = [
  { id: 'v1', name: "Sultan's Dine", logoUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=60", tagline: "Dhaka's Legendary Kacchi Biryani & Borhani", isFeatured: true, rating: 4.9 },
  { id: 'v2', name: "Kacchi Bhai", logoUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=120&auto=format&fit=crop&q=60", tagline: "Basmati Kacchi with Mustard Oil & Real Spices", isFeatured: true, rating: 4.8 },
  { id: 'v3', name: "Green Kitchen", logoUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&auto=format&fit=crop&q=60", tagline: "Healthy, Diet-Friendly Balanced Corporate Meals", isFeatured: true, rating: 4.7 },
  { id: 'v4', name: "Dhaka Catering", logoUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&auto=format&fit=crop&q=60", tagline: "Authentic Home-style Polao, Curries & Lentils", isFeatured: false, rating: 4.6 },
  { id: 'v5', name: "Tehari Ghar", logoUrl: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=120&auto=format&fit=crop&q=60", tagline: "Spicy Beef Tehari made with original Mustard Oil", isFeatured: false, rating: 4.5 },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes: MealType[] = ['lunch', 'dinner'];

export const defaultPackages: MenuPackage[] = [];


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

export const defaultUsers: User[] = [
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