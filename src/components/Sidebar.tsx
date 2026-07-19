import React from 'react';
import { Home, Store, Clock, Wallet, User, HelpCircle, ShieldCheck, LogOut, Menu, X, Award, Plus } from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserType | null;
  onLogout: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, user, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'home', label: 'Daily Menu', icon: Home },
    { id: 'vendors', label: 'All Vendors', icon: Store },
    ...(user ? [
      { id: 'orders', label: 'Order History', icon: Clock },
      { id: 'deposit', label: 'Wallet & Deposit', icon: Wallet },
      { id: 'profile', label: 'Profile Settings', icon: User },
    ] : []),
    { id: 'support', label: 'Help & Support', icon: HelpCircle },
    ...(user && user.role === 'admin' ? [
      { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
    ] : []),
  ];

  const calculateProgress = () => {
    if (!user) return 0;
    let score = 0;
    if (user.name) score += 20;
    if (user.phone) score += 20;
    if (user.officeLink) score += 20;
    if (user.officeMapLink) score += 20;
    if (user.profileImage) score += 20;
    return score;
  };
  const profileProgress = calculateProgress();

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-brand-green text-white px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-xl tracking-tight">Meal100</span>
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">OFFICE</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="text-right text-xs">
              <p className="font-mono font-bold">৳{user.walletBalance.toFixed(0)}</p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-brand-green-hover transition"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white/65 backdrop-blur-sm text-slate-800 flex flex-col border-r border-slate-200/80 transition-transform duration-300 md:sticky md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-100 hidden md:block">
          <div className="mb-1">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-brand-green">Meal100</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-semibold">Office Dining</p>
          </div>
        </div>

        {/* User Mini Profile */}
        {user && (
          <div className="p-4 mx-4 my-4 bg-white/80 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60'}
                alt={user.name || 'User Avatar'}
                className="w-10 h-10 rounded-full object-cover border-2 border-brand-green/30"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden">
                <h4 className="font-bold text-sm truncate text-slate-800">{user.name || 'Set Employee Name'}</h4>
                <p className="text-xs text-slate-500 font-mono truncate">{user.phone}</p>
              </div>
            </div>
            
            {/* Balance Badge */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Wallet Balance:</span>
              <span className="font-mono text-brand-orange font-bold text-sm bg-brand-orange/10 px-2.5 py-1 rounded-lg">
                ৳{user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            {/* Add Deposit Button */}
            <button
              onClick={() => {
                setCurrentTab('deposit');
                setIsOpen(false);
              }}
              className="mt-3.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition focus:outline-none flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Deposit
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all focus:outline-none ${
                  isActive
                    ? 'bg-brand-green text-white shadow-sm font-medium'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 rounded-2xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Profile Completeness Bonus Bar inside Sidebar if logged in */}
        {user && (
          <div className="px-4 mb-2">
            <div className="p-4 bg-orange-50/80 border border-orange-100 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-orange-800 mb-1 flex justify-between">
                <span>Profile {profileProgress}% Complete</span>
                {user.freeMealClaimed && <span className="text-emerald-700 font-bold">Claimed!</span>}
              </p>
              <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-orange transition-all duration-500" 
                  style={{ width: `${profileProgress}%` }}
                ></div>
              </div>
              {!user.freeMealClaimed ? (
                <p className="text-[11px] text-orange-700 mt-2 leading-tight">
                  Complete your profile details to get a <b>free ৳200 meal credit!</b>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-800 mt-2 leading-tight flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600 shrink-0" /> Free meal credit claimed.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {user ? (
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentTab('profile');
                setIsOpen(false);
              }}
              className="w-full bg-brand-green hover:bg-brand-green-hover text-white font-bold py-3 rounded-2xl text-xs transition shadow-sm active:scale-95 focus:outline-none text-center block"
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
