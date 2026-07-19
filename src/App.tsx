import React, { useState, useEffect } from 'react';
import { 
  Home, Store, Clock, Wallet, User as UserIcon, HelpCircle, ShieldCheck, 
  LogOut, AlertCircle, CheckCircle, Plus, Trash2, Edit2, Search, 
  Building, MapPin, TrendingUp, Coins, Award, ArrowUpRight, ArrowDownLeft, 
  UserCheck, ShieldAlert, Star, MessageCircle, FileDown, CalendarDays,
  Printer, X, MessageSquare, ArrowRight, Info, Sun, Moon, ArrowDownCircle
} from 'lucide-react';
import { User, Vendor, MenuPackage, Order, Transaction, OrderStatus, MealType, TransactionType, Review, Withdrawal } from './types';
import Sidebar from './components/Sidebar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import PayslipModal from './components/PayslipModal';

export default function App() {
  // Session & Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('meal100_token'));
  const [user, setUser] = useState<User | null>(null);
  
  // App UI State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuPackages, setMenuPackages] = useState<MenuPackage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Toggle states
  const [mealTypeToggle, setMealTypeToggle] = useState<MealType>('dinner');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Default selected day of week based on current day
  const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  const initialDay = daysOfWeek[currentDayIndex === 0 ? 6 : currentDayIndex - 1]; // Map to Mon-Sun index
  const [selectedDay, setSelectedDay] = useState<string>(initialDay);

  // OTP Login Drawer/Modal State
  const [otpPhone, setOtpPhone] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpStep, setOtpStep] = useState<'none' | 'phone' | 'verify'>('none');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Pending Actions (Resume action after OTP verification)
  const [pendingAction, setPendingAction] = useState<{
    type: 'order' | 'deposit';
    data: any;
  } | null>(null);

  // Detail Modal & Quantities State
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});
  const [depositAmountInput, setDepositAmountInput] = useState<string>('1500');
  const [depositLoading, setDepositLoading] = useState<boolean>(false);

  // Withdraw States
  const [withdrawPending, setWithdrawPending] = useState<boolean>(() => {
    return localStorage.getItem('meal100_withdraw_pending') === 'true';
  });
  const [withdrawAmount, setWithdrawAmount] = useState<number>(() => {
    const saved = localStorage.getItem('meal100_withdraw_amount');
    return saved ? parseFloat(saved) : 0;
  });
  const [withdrawReason, setWithdrawReason] = useState<string>(() => {
    return localStorage.getItem('meal100_withdraw_reason') || '';
  });
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawReasonInput, setWithdrawReasonInput] = useState<string>('');

  const displayBalance = withdrawPending ? 0 : (user ? user.walletBalance : 0);

  // Print/Payslip State
  const [selectedPayslipTxn, setSelectedPayslipTxn] = useState<Transaction | null>(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState<string>('');
  const [profileOfficeLink, setProfileOfficeLink] = useState<string>('');
  const [profileOfficeMapLink, setProfileOfficeMapLink] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Review & Rating State
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [confirmingOrderData, setConfirmingOrderData] = useState<{
    vendorId: string;
    packageId: string;
    qty: number;
    mealType: MealType;
    packageName: string;
    vendorName: string;
    price: number;
    totalCost: number;
    currentBalance: number;
    newBalance: number;
  } | null>(null);
  const [confirmingLoading, setConfirmingLoading] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [vendorReviews, setVendorReviews] = useState<Record<string, Review[]>>({});

  // Admin Specific state
  const [adminSubTab, setAdminSubTab] = useState<'vendors' | 'menu' | 'orders' | 'deposits' | 'users' | 'reviews'>('orders');
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [adminReviewsLoading, setAdminReviewsLoading] = useState<boolean>(false);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminWithdrawalsLoading, setAdminWithdrawalsLoading] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<Partial<Vendor> | null>(null);
  const [editingPackage, setEditingPackage] = useState<Partial<MenuPackage> | null>(null);
  const [manualAdjustmentUser, setManualAdjustmentUser] = useState<string>('');
  const [manualAdjustmentAmount, setManualAdjustmentAmount] = useState<string>('');
  const [manualAdjustmentMemo, setManualAdjustmentMemo] = useState<string>('');

  // Live countdown clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-update selected day of week in real time
  useEffect(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = currentTime.getDay(); // 0 is Sunday, 1 is Monday...
    const currentDayName = days[currentDayIndex === 0 ? 6 : currentDayIndex - 1];
    if (selectedDay !== currentDayName) {
      setSelectedDay(currentDayName);
    }
  }, [currentTime, selectedDay]);

  // Auto-clear messages
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Fetch Current User on Token load
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        // Initialize profile states
        setProfileName(data.name || '');
        setProfileOfficeLink(data.officeLink || '');
        setProfileOfficeMapLink(data.officeMapLink || '');
        setProfileImage(data.profileImage || '');
      } else {
        // Token stale
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Main data loaders
  const loadData = async () => {
    setLoading(true);
    try {
      // Vendors
      const vRes = await fetch('/api/vendors');
      if (vRes.ok) {
        const vData = await vRes.json();
        setVendors(vData);
      }

      // Menu packages for selected day and meal toggle
      const pRes = await fetch(`/api/menu-packages?day=${selectedDay}&mealType=${mealTypeToggle}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        setMenuPackages(pData);
      }

      if (token) {
        // Authenticated queries
        const oRes = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (oRes.ok) setOrders(await oRes.json());

        const tRes = await fetch('/api/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tRes.ok) setTransactions(await tRes.json());

        // Fetch and sync withdrawal requests
        const wRes = await fetch('/api/withdrawals', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (wRes.ok) {
          const wData = await wRes.json();
          const pendingW = wData.find((w: any) => w.status === 'pending');
          if (pendingW) {
            setWithdrawPending(true);
            setWithdrawAmount(pendingW.amount);
            setWithdrawReason(pendingW.reason);
            localStorage.setItem('meal100_withdraw_pending', 'true');
            localStorage.setItem('meal100_withdraw_amount', pendingW.amount.toString());
            localStorage.setItem('meal100_withdraw_reason', pendingW.reason);
          } else {
            setWithdrawPending(false);
            setWithdrawAmount(0);
            setWithdrawReason('');
            localStorage.removeItem('meal100_withdraw_pending');
            localStorage.removeItem('meal100_withdraw_amount');
            localStorage.removeItem('meal100_withdraw_reason');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load menu data', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial data load
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [token, selectedDay, mealTypeToggle]);

  // Fetch admin items if admin tab is active
  useEffect(() => {
    if (user && user.role === 'admin' && currentTab === 'admin') {
      if (adminSubTab === 'reviews') {
        fetchAdminReviews();
      } else if (adminSubTab === 'deposits') {
        fetchAdminUsers();
        fetchAdminWithdrawals();
      } else {
        fetchAdminUsers();
      }
    }
  }, [user, currentTab, adminSubTab]);

  // Fetch reviews for expanded vendor
  useEffect(() => {
    if (expandedVendorId) {
      fetchReviewsForVendor(expandedVendorId);
    }
  }, [expandedVendorId]);

  const fetchReviewsForVendor = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/reviews?vendorId=${vendorId}`);
      if (res.ok) {
        const data = await res.json();
        setVendorReviews(prev => ({
          ...prev,
          [vendorId]: data
        }));
      }
    } catch (err) {
      console.error('Failed to load reviews for vendor', vendorId, err);
    }
  };

  const fetchAdminReviews = async () => {
    if (!token) return;
    setAdminReviewsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminReviews(await res.json());
      }
    } catch (err) {
      console.error('Failed to load admin reviews', err);
    } finally {
      setAdminReviewsLoading(false);
    }
  };

  const handleOpenReviewModal = (order: Order) => {
    setReviewingOrder(order);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrder || !token) return;
    setReviewLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: reviewingOrder.id,
          vendorId: reviewingOrder.vendorId,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Your review and rating have been posted successfully.');
        setReviewingOrder(null);
        loadData(); // refreshes order history & vendor list (with updated dynamic ratings!)
      } else {
        setErrorMsg(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setErrorMsg('Network error submitting review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAdminToggleHideReview = async (reviewId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/toggle-hide`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Review visibility toggled.');
        fetchAdminReviews();
        loadData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to toggle review status');
      }
    } catch (err) {
      setErrorMsg('Network error updating review');
    }
  };

  const handleAdminDeleteReview = async (reviewId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Review deleted permanently.');
        fetchAdminReviews();
        loadData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to delete review');
      }
    } catch (err) {
      setErrorMsg('Network error deleting review');
    }
  };

  const fetchAdminUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminUsers(await res.json());
      }
    } catch (err) {
      console.error('Failed to load admin users', err);
    }
  };

  const fetchAdminWithdrawals = async () => {
    if (!token) return;
    setAdminWithdrawalsLoading(true);
    try {
      const res = await fetch('/api/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAdminWithdrawals(await res.json());
      }
    } catch (err) {
      console.error('Failed to load admin withdrawals', err);
    } finally {
      setAdminWithdrawalsLoading(false);
    }
  };

  const handleAdminWithdrawalStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    const confirmMsg = `Are you sure you want to mark this withdrawal request as ${status}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessMsg(`Withdrawal request has been ${status}!`);
        fetchAdminWithdrawals();
        fetchAdminUsers();
        loadData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || `Failed to update withdrawal status`);
      }
    } catch (err) {
      setErrorMsg('Network error updating withdrawal status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('meal100_token');
    setToken(null);
    setUser(null);
    setOrders([]);
    setTransactions([]);
    setCurrentTab('home');
    setSuccessMsg('Successfully signed out from your session.');
  };

  // Authentication Flow Handlers
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhone || otpPhone.length < 10) {
      setErrorMsg('Please enter a valid Bangladeshi phone number (e.g. 01712345678)');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpStep('verify');
        setDebugOtp(data.debugOTP || null);
        setSuccessMsg(`Mock SMS sent to ${otpPhone}! Verification OTP code is: ${data.debugOTP}`);
      } else {
        setErrorMsg(data.error || 'Failed to request OTP');
      }
    } catch (err) {
      setErrorMsg('Network error requesting OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('meal100_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setOtpStep('none');
        setSuccessMsg('Authentication successful! Welcome to Meal100.');
        
        // AUTO RESUME PENDING ACTION (The user's intended checkout or deposit!)
        if (pendingAction) {
          if (pendingAction.type === 'order') {
            const { vendorId, packageId, qty, mealType } = pendingAction.data;
            executeOrder(vendorId, packageId, qty, mealType, data.token);
          } else if (pendingAction.type === 'deposit') {
            const { amount } = pendingAction.data;
            executeDeposit(amount, data.token);
          }
          setPendingAction(null);
        }
      } else {
        setErrorMsg(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setErrorMsg('Network error verifying OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Open login gate, saving what the user wanted to do
  const triggerAuthGate = (actionType: 'order' | 'deposit', actionData: any) => {
    setPendingAction({ type: actionType, data: actionData });
    setOtpStep('phone');
    setOtpPhone(actionType === 'order' ? '01722222222' : '01722222222'); // Helpful prefill in dev
  };

  // ORDER EXECUTION FLOW (Server state verified)
  const executeOrder = async (vendorId: string, packageId: string, qty: number, mealType: MealType, activeToken: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ vendorId, packageId, quantity: qty, mealType })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Order of ${qty} meals placed successfully! BDT ${data.order.totalPrice} deducted from wallet.`);
        setCurrentTab('orders');
        loadData();
      } else {
        if (data.requiresDeposit) {
          setErrorMsg(data.error);
          // Auto-suggest deposit to user
          setDepositAmountInput(Math.max(1000, Math.ceil(data.requiresDeposit)).toString());
          setCurrentTab('deposit');
        } else {
          setErrorMsg(data.error || 'Failed to place order');
        }
      }
    } catch (err) {
      setErrorMsg('Network error placing order');
    }
  };

  const handleConfirmOrder = async () => {
    if (!confirmingOrderData || !token) return;
    setConfirmingLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          vendorId: confirmingOrderData.vendorId, 
          packageId: confirmingOrderData.packageId, 
          quantity: confirmingOrderData.qty, 
          mealType: confirmingOrderData.mealType 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Order Successful! Your meal booking is complete.');
        setConfirmingOrderData(null);
        setCurrentTab('orders');
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to place order');
      }
    } catch (err) {
      setErrorMsg('Network error placing order');
    } finally {
      setConfirmingLoading(false);
    }
  };

  const handlePlaceOrder = (vendorId: string, packageId: string, mealType: MealType) => {
    const qty = orderQuantities[packageId] || 5;
    
    if (qty < 5) {
      setErrorMsg('Core Rule: Minimum order quantity is 5 meals.');
      return;
    }

    const isFirstCardPkg = homeFeaturedPackages.length > 0 && homeFeaturedPackages[0].pkg.id === packageId;
    const timerInfo = getCountdownInfo(mealType);
    if (timerInfo.isClosed && !isFirstCardPkg) {
      setErrorMsg(`Booking closed: ${mealType === 'lunch' ? 'Lunch' : 'Dinner'} ordering window is currently closed.`);
      return;
    }

    if (!token) {
      triggerAuthGate('order', { vendorId, packageId, qty, mealType });
      return;
    }

    const pkg = menuPackages.find(p => p.id === packageId);
    const currentPrice = pkg && pkg.discountPrice && pkg.discountPrice < pkg.price ? pkg.discountPrice : (pkg ? pkg.price : 0);
    const totalCost = currentPrice * qty;

    if (user && displayBalance >= totalCost) {
      const vendorName = vendors.find(v => v.id === vendorId)?.name || 'Caterer';
      const packageName = pkg?.packageName || 'Meal Package';
      setConfirmingOrderData({
        vendorId,
        packageId,
        qty,
        mealType,
        packageName,
        vendorName,
        price: currentPrice,
        totalCost,
        currentBalance: displayBalance,
        newBalance: displayBalance - totalCost
      });
      return;
    }

    executeOrder(vendorId, packageId, qty, mealType, token);
  };

  // CANCEL ORDER
  const handleCancelOrder = async (orderId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to cancel this order? The full amount will be refunded to your wallet instantly.')) return;

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'Cancelled' })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Order cancelled and BDT refunded to your wallet balance.');
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      setErrorMsg('Network error cancelling order');
    }
  };

  // DEPOSIT EXECUTION FLOW
  const executeDeposit = async (amountVal: number, activeToken: string) => {
    if (amountVal < 1000) {
      setErrorMsg('Minimum deposit per transaction is ৳1000.');
      return;
    }
    setDepositLoading(true);
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ amount: amountVal })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Deposit of ৳${amountVal} completed via Simulated SSLCommerz Gateway!`);
        loadData();
      } else {
        setErrorMsg(data.error || 'Deposit failed');
      }
    } catch (err) {
      setErrorMsg('Network error executing deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmountInput);
    if (isNaN(amt) || amt < 1000) {
      setErrorMsg('Core Rule: Minimum deposit amount is ৳1000.');
      return;
    }

    if (!token) {
      triggerAuthGate('deposit', { amount: amt });
      return;
    }

    executeDeposit(amt, token);
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be logged in to request a withdrawal.');
      return;
    }
    if (!withdrawReasonInput.trim()) {
      setErrorMsg('Withdrawal reason is required.');
      return;
    }
    const currentBal = user.walletBalance;
    if (currentBal <= 0) {
      setErrorMsg('You do not have any balance to withdraw.');
      return;
    }
    if (!token) return;

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: withdrawReasonInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawPending(true);
        setWithdrawAmount(data.withdrawal.amount);
        setWithdrawReason(data.withdrawal.reason);
        
        // Save in localStorage for persistence
        localStorage.setItem('meal100_withdraw_pending', 'true');
        localStorage.setItem('meal100_withdraw_amount', data.withdrawal.amount.toString());
        localStorage.setItem('meal100_withdraw_reason', data.withdrawal.reason);

        // Update local user's balance to 0 as requested
        setUser(data.user);

        // Reload data to reflect new transaction in ledger
        loadData();

        // Close modal
        setShowWithdrawModal(false);
        setSuccessMsg('Withdrawal request submitted successfully! Your balance is now pending withdrawal.');
      } else {
        setErrorMsg(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      setErrorMsg('Network error submitting withdrawal request.');
    }
  };

  // PROFILE SAVING FLOW & FREE MEAL AWARD TRIGGER
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!profileName.trim()) {
      setErrorMsg('Please specify your full name.');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileName,
          officeLink: profileOfficeLink,
          officeMapLink: profileOfficeMapLink,
          profileImage: profileImage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setSuccessMsg('Profile updated successfully!');
        if (data.freeMealClaimed && !user?.freeMealClaimed) {
          alert('🎉 Congratulations! You have completed all fields and received a free ৳200 Meal Credit in your wallet!');
        }
      } else {
        setErrorMsg(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg('Network error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // ADMIN OPERATIONS
  const handleAdminStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Order status updated to ${newStatus}`);
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to update order status');
      }
    } catch (err) {
      setErrorMsg('Network error updating status');
    }
  };

  const handleAdminSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingVendor) return;
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingVendor)
      });
      if (res.ok) {
        setSuccessMsg('Vendor saved successfully.');
        setEditingVendor(null);
        loadData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to save vendor');
      }
    } catch (err) {
      setErrorMsg('Network error saving vendor');
    }
  };

  const handleAdminDeleteVendor = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this vendor? This will delete all its menu packages too.')) return;
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Vendor deleted.');
        loadData();
      }
    } catch (err) {
      setErrorMsg('Network error deleting vendor');
    }
  };

  const handleAdminSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPackage) return;
    try {
      const res = await fetch('/api/admin/menu-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingPackage)
      });
      if (res.ok) {
        setSuccessMsg('Menu package saved successfully.');
        setEditingPackage(null);
        loadData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Failed to save package');
      }
    } catch (err) {
      setErrorMsg('Network error saving package');
    }
  };

  const handleAdminDeletePackage = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this menu package?')) return;
    try {
      const res = await fetch(`/api/admin/menu-packages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Menu package deleted.');
        loadData();
      }
    } catch (err) {
      setErrorMsg('Network error deleting menu package');
    }
  };

  const handleAdminAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const amt = parseFloat(manualAdjustmentAmount);
    if (!manualAdjustmentUser || isNaN(amt)) {
      setErrorMsg('Please specify the user and a valid adjustment amount.');
      return;
    }
    try {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: manualAdjustmentUser,
          amount: amt,
          memo: manualAdjustmentMemo
        })
      });
      if (res.ok) {
        setSuccessMsg('User balance adjusted manually. Audit log added.');
        setManualAdjustmentAmount('');
        setManualAdjustmentMemo('');
        setManualAdjustmentUser('');
        fetchAdminUsers();
        loadData();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || 'Adjustment failed');
      }
    } catch (err) {
      setErrorMsg('Network error adjusting balance');
    }
  };

  // Computed featured packages from 3 different vendors sorted by rating
  const homeFeaturedPackages = (() => {
    // Map packages to their vendor rating
    const pkgsWithVendorRating = menuPackages.map(pkg => {
      const vendor = vendors.find(v => v.id === pkg.vendorId);
      return {
        pkg,
        vendor,
        rating: vendor ? (vendor.rating || 0) : 0
      };
    });

    // Sort by rating descending
    pkgsWithVendorRating.sort((a, b) => b.rating - a.rating);

    // Pick top 3 from different vendors
    const selected: typeof pkgsWithVendorRating = [];
    const vendorIdsUsed = new Set<string>();

    for (const item of pkgsWithVendorRating) {
      if (item.vendor && !vendorIdsUsed.has(item.vendor.id)) {
        vendorIdsUsed.add(item.vendor.id);
        selected.push(item);
        if (selected.length === 3) break;
      }
    }

    return selected;
  })();

  const getCountdownInfo = (targetMealType?: MealType) => {
    const mealType = targetMealType || mealTypeToggle;
    if (mealType === 'lunch') {
      const start = new Date(currentTime);
      start.setHours(0, 1, 0, 0); // 12:01 AM

      const deadline = new Date(currentTime);
      deadline.setHours(10, 0, 0, 0); // 10:00 AM

      const isActive = currentTime >= start && currentTime < deadline;
      const isClosed = !isActive;

      let diffMs = 0;
      if (isActive) {
        diffMs = deadline.getTime() - currentTime.getTime();
      }

      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffS = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      const timeStr = `${pad(diffH)}:${pad(diffM)}:${pad(diffS)}`;

      return {
        isClosed,
        statusLabel: isClosed ? 'Lunch Booking Period Closed' : 'Lunch Booking Active',
        statusDesc: isClosed 
          ? 'The morning 10:00 AM cut-off has passed. Any subsequent lunch orders will register for tomorrow.' 
          : 'Place your order before the 10:00 AM deadline for direct floor delivery.',
        timeStr,
        badgeBg: isClosed ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-800',
        timerLabel: isClosed ? 'Lunch order window closed' : 'Time remaining to order Lunch'
      };
    } else {
      const start = new Date(currentTime);
      start.setHours(0, 1, 0, 0); // 12:01 AM

      const deadline = new Date(currentTime);
      deadline.setHours(23, 45, 0, 0); // 11:45 PM

      const isActive = currentTime >= start && currentTime < deadline;
      const isClosed = !isActive;

      let diffMs = 0;
      if (isActive) {
        diffMs = deadline.getTime() - currentTime.getTime();
      }

      const diffH = Math.floor(diffMs / (1000 * 60 * 60));
      const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffS = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      const timeStr = `${pad(diffH)}:${pad(diffM)}:${pad(diffS)}`;

      return {
        isClosed,
        statusLabel: isClosed ? 'Dinner Booking Period Closed' : 'Dinner Booking Active',
        statusDesc: isClosed 
          ? 'The evening 11:45 PM cutoff has passed. Dinner bookings reopen tomorrow.' 
          : 'Caterers accept dinner bookings from 12:01 AM to 11:45 PM. Secure yours on time!',
        timeStr,
        badgeBg: isClosed ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-800',
        timerLabel: isClosed ? 'Dinner order window closed' : 'Time remaining to order Dinner'
      };
    }
  };

  const timerInfo = getCountdownInfo();

  // Profile completion calculations
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
    <div className="min-h-screen bg-brand-bg text-slate-800 flex flex-col md:flex-row font-sans" id="meal100-app-root">
      
      {/* Side navigation bar */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Alerts Center */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-brand-orange rounded-r-xl flex items-start gap-3 shadow-sm animate-fade-in" id="error-alert">
            <AlertCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <div>
              <h5 className="font-serif font-bold text-rose-800 text-sm">Action Blocked</h5>
              <p className="text-rose-700 text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-brand-green/10 border-l-4 border-brand-green rounded-r-xl flex items-start gap-3 shadow-sm animate-fade-in" id="success-alert">
            <CheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
            <div>
              <h5 className="font-serif font-bold text-brand-green text-sm">Operation Success</h5>
              <p className="text-brand-green/95 text-xs mt-0.5">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Guest Banner */}
        {!user && (
          <div className="mb-6 p-6 bg-orange-50/80 rounded-2xl border border-orange-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <Info className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <h4 className="font-serif font-bold text-brand-orange text-sm">Prepaid Wallet Access Mode</h4>
                <p className="text-orange-800/80 text-xs mt-1">
                  You are browsing as a guest. Simply click "Order Now" or visit Profile to sign in via OTP. We'll resume your action automatically!
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerAuthGate('deposit', {})}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 focus:outline-none shrink-0"
            >
              Log In Now
            </button>
          </div>
        )}

         {/* TAB 1: HOME PAGE */}
        {currentTab === 'home' && (
          <div className="space-y-8" id="tab-home">
            
            {/* Hero / Header Section */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden transition-all duration-700 border ${
              mealTypeToggle === 'lunch'
                ? 'bg-gradient-to-br from-[#0f1e36] to-brand-green border-brand-green/20'
                : 'bg-gradient-to-br from-neutral-900 to-black border-neutral-800'
            }`}>
              
              {/* Sun/Moon Arise Effect */}
              <div className="absolute right-12 top-6 md:top-8 w-24 h-24 pointer-events-none hidden md:block overflow-visible" key={mealTypeToggle}>
                {mealTypeToggle === 'lunch' ? (
                  <div className="animate-[riseUp_1.2s_ease-out_forwards] flex flex-col items-center">
                    {/* Glowing yellow Sun with custom shine animation */}
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-500 rounded-full border-2 border-amber-200 animate-sun-shine" />
                    <span className="text-[9px] text-amber-200 font-bold tracking-widest uppercase mt-1.5 filter drop-shadow font-mono">Lunch Sun</span>
                  </div>
                ) : (
                  <div className="animate-[riseUp_1.2s_ease-out_forwards] flex flex-col items-center">
                    {/* Glowing silver Moon with custom shine animation */}
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 via-indigo-200 to-indigo-300 rounded-full border-2 border-slate-200 relative overflow-hidden animate-moon-shine">
                      {/* Lunar craters */}
                      <div className="absolute top-2 left-3 w-3 h-3 bg-slate-300/40 rounded-full" />
                      <div className="absolute top-7 left-7 w-1.5 h-1.5 bg-slate-300/40 rounded-full" />
                      <div className="absolute top-5 left-1.5 w-1 h-1 bg-slate-300/40 rounded-full" />
                    </div>
                    <span className="text-[9px] text-indigo-200 font-bold tracking-widest uppercase mt-1.5 filter drop-shadow font-mono">Dinner Moon</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 z-10 relative">
                <div className="inline-flex items-center gap-1.5 bg-white/10 text-slate-100 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  Prepaid Corporate Dining Platform
                </div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold tracking-tight text-white">Daily Office Catering</h2>
                <p className="text-white/80 text-xs md:text-sm max-w-xl">
                  Order premium Lunch and Dinner boxes prepared by Dhaka's best caterers. Minimum 5 meals. Deducted directly from your prepaid wallet.
                </p>
              </div>

              {/* Day & Meal Selector Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto mt-4 lg:mt-0 z-10 relative">
                
                {/* Lunch / Dinner Toggle */}
                <div className="bg-[#364436]/60 p-1.5 rounded-2xl flex border border-white/10">
                  <button
                    onClick={() => setMealTypeToggle('lunch')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${
                      mealTypeToggle === 'lunch'
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    Lunch Meals
                  </button>
                  <button
                    onClick={() => setMealTypeToggle('dinner')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${
                      mealTypeToggle === 'dinner'
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    Dinner Meals
                  </button>
                </div>

                {/* Day display (static & unclickable) */}
                <div className="relative flex items-center bg-[#364436]/80 border border-white/10 text-white px-4 py-3 pr-10 rounded-2xl text-xs font-bold select-none cursor-default">
                  <span>{selectedDay} Menu</span>
                  <CalendarDays className="w-4 h-4 text-slate-300 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

              </div>
            </div>

            {/* Countdown timer segment - Placed before the food order card */}
            {(() => {
              const [tHours, tMinutes, tSeconds] = (timerInfo.timeStr || "00:00:00").split(':');
              return (
                <div className={`p-6 md:p-8 rounded-3xl border ${timerInfo.badgeBg} bg-white/40 backdrop-blur-xs flex flex-col items-center justify-center text-center shadow-xs relative overflow-hidden`} id="booking-countdown-container">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  
                  {/* Text on top of the Countdown */}
                  <div className="space-y-1 mb-4 z-10">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-brand-orange animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sans">
                        {timerInfo.timerLabel}
                      </span>
                    </div>
                    <h4 className={`font-serif font-black text-base md:text-lg flex items-center justify-center gap-2 ${timerInfo.isClosed ? 'text-red-600' : 'text-slate-800'}`}>
                      {mealTypeToggle === 'lunch' ? (
                        <Sun className={`w-5 h-5 animate-pulse ${timerInfo.isClosed ? 'text-red-500 fill-red-100' : 'text-amber-500 fill-amber-100'}`} />
                      ) : (
                        <Moon className={`w-5 h-5 animate-pulse ${timerInfo.isClosed ? 'text-red-500 fill-red-100' : 'text-indigo-500 fill-indigo-100'}`} />
                      )}
                      {timerInfo.statusLabel}
                    </h4>
                  </div>

                  {/* Centered Massive Countdown Counter or Closed Message */}
                  {timerInfo.isClosed ? (
                    <div className="my-4 py-4 px-8 bg-rose-50 border border-rose-100 rounded-2xl text-center z-10 shadow-3xs animate-fade-in" id="closed-message-container">
                      <span className="text-xl md:text-2xl font-serif font-black text-red-600 tracking-wide block">
                        Order tomorrow before 10 Am
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center gap-2.5 md:gap-4 my-2 z-10">
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-900 text-white text-3xl md:text-5xl font-mono font-black p-3 md:p-4 rounded-2xl shadow-md border border-slate-800 min-w-[65px] md:min-w-[85px] text-center tracking-wider relative overflow-hidden">
                          <div className="absolute inset-x-0 top-0 h-[50%] bg-white/5 border-b border-white/5" />
                          {tHours}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 font-mono">Hours</span>
                      </div>
                      
                      <span className="text-xl md:text-3xl font-black text-slate-400 animate-pulse pb-5">:</span>
                      
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-900 text-white text-3xl md:text-5xl font-mono font-black p-3 md:p-4 rounded-2xl shadow-md border border-slate-800 min-w-[65px] md:min-w-[85px] text-center tracking-wider relative overflow-hidden">
                          <div className="absolute inset-x-0 top-0 h-[50%] bg-white/5 border-b border-white/5" />
                          {tMinutes}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 font-mono">Minutes</span>
                      </div>
                      
                      <span className="text-xl md:text-3xl font-black text-slate-400 animate-pulse pb-5">:</span>
                      
                      <div className="flex flex-col items-center">
                        <div className="bg-slate-900 text-white text-3xl md:text-5xl font-mono font-black p-3 md:p-4 rounded-2xl shadow-md border border-slate-800 min-w-[65px] md:min-w-[85px] text-center tracking-wider relative overflow-hidden">
                          <div className="absolute inset-x-0 top-0 h-[50%] bg-white/5 border-b border-white/5" />
                          {tSeconds}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 font-mono">Seconds</span>
                      </div>
                    </div>
                  )}

                  {/* Text below the Countdown */}
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl mt-4 z-10">
                    {timerInfo.statusDesc}
                  </p>
                </div>
              );
            })()}

            {/* Top 3 High Rating Unique Vendor Cards */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-slate-800 tracking-tight">Top Rated Meals for {selectedDay}</h3>
                  <p className="text-xs text-slate-500">Showing the top 3 highest rated menus of Dhaka's premium caterers</p>
                </div>
                <button 
                  onClick={() => setCurrentTab('vendors')}
                  className="text-xs font-bold text-brand-green hover:text-brand-green-hover flex items-center gap-1.5 group"
                >
                  View All Vendors
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition animate-pulse" />
                </button>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-400 text-sm">Loading today's handpicked packages...</div>
              ) : homeFeaturedPackages.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl text-center border border-dashed border-gray-200 text-slate-400 text-xs">
                  No active packages for {mealTypeToggle} on {selectedDay}. Select another day or check Admin Settings.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {homeFeaturedPackages.map(({ pkg, vendor }, index) => {
                    if (!vendor) return null;
                    
                    const qty = orderQuantities[pkg.id] || 5;
                    const currentPrice = pkg.discountPrice || pkg.price;
                    const originalPrice = pkg.price;
                    const hasDiscount = pkg.discountPrice && pkg.discountPrice < pkg.price;
                    const isFirstCard = index === 0;

                    return (
                      <div key={pkg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group" id={`featured-pkg-${pkg.id}`}>
                        
                        {/* Card Image Banner */}
                        <div className="h-36 bg-slate-100 relative">
                          <img
                            src={vendor.logoUrl}
                            alt={vendor.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                            <div>
                              <h4 className="text-white font-bold text-base tracking-tight leading-tight">{vendor.name}</h4>
                              <p className="text-[10px] text-slate-300 line-clamp-1">{vendor.tagline}</p>
                            </div>
                          </div>
                          
                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-brand-orange font-mono text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                            {vendor.rating}
                          </div>
                        </div>

                        {/* Package Details & Ordering Section */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] uppercase font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded">
                                {pkg.packageName}
                              </span>
                              
                              {/* Pricing */}
                              <div className="text-right shrink-0">
                                {hasDiscount && (
                                  <p className="text-[10px] text-brand-orange line-through font-mono">৳{originalPrice}</p>
                                )}
                                <p className="text-sm font-black text-slate-800 font-mono">৳{currentPrice}</p>
                                <span className="text-[9px] text-slate-400 block font-mono">per meal</span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-600 font-medium line-clamp-3 min-h-[48px] bg-stone-50/50 p-2.5 rounded-xl border border-slate-100/60 leading-relaxed">
                              {pkg.items}
                            </p>
                          </div>

                          {/* Qty and Place Order Area */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Qty:</span>
                              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                                <button
                                  onClick={() => setOrderQuantities({
                                    ...orderQuantities,
                                    [pkg.id]: Math.max(5, qty - 1)
                                  })}
                                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-50 font-bold text-sm border-r border-gray-200 transition"
                                >
                                  -
                                </button>
                                <span className="px-3.5 font-mono text-xs font-bold text-slate-800">{qty}</span>
                                <button
                                  onClick={() => setOrderQuantities({
                                    ...orderQuantities,
                                    [pkg.id]: qty + 1
                                  })}
                                  className="px-2.5 py-1 text-slate-500 hover:bg-slate-50 font-bold text-sm border-l border-gray-200 transition"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {(() => {
                              const isBtnDisabled = timerInfo.isClosed && !isFirstCard;
                              return (
                                <button
                                  disabled={isBtnDisabled}
                                  onClick={() => handlePlaceOrder(vendor.id, pkg.id, mealTypeToggle)}
                                  className={`w-full max-w-[220px] text-sm font-bold py-2.5 px-4 rounded-xl transition focus:outline-none text-center ${
                                    isBtnDisabled
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-brand-green hover:bg-brand-green-hover text-white shadow-sm hover:shadow active:scale-95'
                                  }`}
                                >
                                  {isBtnDisabled ? 'Order Closed' : `Order: ৳${(currentPrice * qty).toLocaleString()}`}
                                </button>
                              );
                            })()}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lower Section: Last Order Status (Left Down) and Bento Rules (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
              
              {/* Last Order Info - Left Down Position */}
              <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-4" id="last-order-tracker">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
                    <h4 className="font-serif font-bold text-slate-800 text-sm">Your Last Order</h4>
                  </div>
                  
                  {!user ? (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-xs text-slate-400 italic">Please sign in to monitor your ongoing order status.</p>
                      <button
                        onClick={() => triggerAuthGate('deposit', {})}
                        className="text-[11px] font-bold text-brand-green hover:underline focus:outline-none"
                      >
                        Sign In Now
                      </button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 italic">No orders placed yet. Select a catering set above to begin dining!</p>
                    </div>
                  ) : (() => {
                    const latestOrder = orders[0];
                    const isCooking = latestOrder.status === 'Cooking';
                    const isOnTheWay = latestOrder.status === 'On the way';
                    const isDelivered = latestOrder.status === 'Delivered';
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">{latestOrder.vendorName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">#{latestOrder.id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDelivered ? 'bg-emerald-50 text-emerald-700' :
                            isOnTheWay ? 'bg-amber-50 text-amber-700 animate-pulse' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {latestOrder.status}
                          </span>
                        </div>
                        
                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-[11px] font-semibold text-slate-600">
                          <p className="truncate">{latestOrder.packageName}</p>
                          <div className="flex justify-between mt-1 text-slate-400 text-[10px] font-normal">
                            <span>Qty: {latestOrder.quantity} meals</span>
                            <span className="font-mono">৳{latestOrder.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {user && orders.length > 0 && (
                  <button
                    onClick={() => setCurrentTab('status')}
                    className="w-full text-center text-[10px] font-bold text-brand-green hover:text-brand-green-hover bg-brand-green/5 hover:bg-brand-green/10 py-2.5 rounded-xl transition flex items-center justify-center gap-1"
                  >
                    Track All Orders
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Order Rules - Right Bento Section */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex gap-4">
                  <div className="p-3 bg-brand-green/10 rounded-2xl text-brand-green shrink-0 self-start">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm">Minimum Deposit ৳1000</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Prepay into your secure workspace dining wallet via bKash, Nagad, or bank card to enable active ordering.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange shrink-0 self-start">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm">Minimum Quantity 5</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Meals are packaged in batches of 5 to allow efficient single-route catering delivery straight to office floors.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-3 bg-orange-50 rounded-2xl text-brand-orange shrink-0 self-start">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-slate-800 text-sm">Free Meal Credit (Claim ৳200)</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Complete your employee profile including a photo, office location map, and corporate socials to earn ৳200 instantly!
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: VENDOR DIRECTORY (WITH ACCORDION EXPANSION) */}
        {currentTab === 'vendors' && (
          <div className="space-y-6" id="tab-vendors">
            
            {/* Hero / Header Section */}
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden transition-all duration-700 border ${
              mealTypeToggle === 'lunch'
                ? 'bg-gradient-to-br from-[#0f1e36] to-brand-green border-brand-green/20'
                : 'bg-gradient-to-br from-neutral-900 to-black border-neutral-800'
            }`}>
              
              {/* Sun/Moon Arise Effect */}
              <div className="absolute right-12 top-6 md:top-8 w-24 h-24 pointer-events-none hidden md:block overflow-visible" key={mealTypeToggle}>
                {mealTypeToggle === 'lunch' ? (
                  <div className="animate-[riseUp_1.2s_ease-out_forwards] flex flex-col items-center">
                    {/* Glowing yellow Sun with custom shine animation */}
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-orange-400 to-yellow-500 rounded-full border-2 border-amber-200 animate-sun-shine" />
                    <span className="text-[9px] text-amber-200 font-bold tracking-widest uppercase mt-1.5 filter drop-shadow font-mono">Lunch Sun</span>
                  </div>
                ) : (
                  <div className="animate-[riseUp_1.2s_ease-out_forwards] flex flex-col items-center">
                    {/* Glowing silver Moon with custom shine animation */}
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-100 via-indigo-200 to-indigo-300 rounded-full border-2 border-slate-200 relative overflow-hidden animate-moon-shine">
                      {/* Lunar craters */}
                      <div className="absolute top-2 left-3 w-3 h-3 bg-slate-300/40 rounded-full" />
                      <div className="absolute top-7 left-7 w-1.5 h-1.5 bg-slate-300/40 rounded-full" />
                      <div className="absolute top-5 left-1.5 w-1 h-1 bg-slate-300/40 rounded-full" />
                    </div>
                    <span className="text-[9px] text-indigo-200 font-bold tracking-widest uppercase mt-1.5 filter drop-shadow font-mono">Dinner Moon</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 z-10 relative">
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Catering Vendors</h3>
                <p className="text-white/80 text-xs md:text-sm">
                  Browse and view detailed weekly packages per vendor
                </p>
              </div>

              {/* Selector buttons in same style */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto mt-4 lg:mt-0 z-10 relative">
                
                {/* Lunch / Dinner Toggle */}
                <div className="bg-[#364436]/60 p-1.5 rounded-2xl flex border border-white/10">
                  <button
                    onClick={() => setMealTypeToggle('lunch')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${
                      mealTypeToggle === 'lunch'
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    Lunch Meals
                  </button>
                  <button
                    onClick={() => setMealTypeToggle('dinner')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition focus:outline-none ${
                      mealTypeToggle === 'dinner'
                        ? 'bg-brand-orange text-white shadow-sm'
                        : 'text-slate-200 hover:text-white'
                    }`}
                  >
                    Dinner Meals
                  </button>
                </div>

                {/* Day display (static & unclickable) */}
                <div className="relative flex items-center bg-[#364436]/80 border border-white/10 text-white px-4 py-3 pr-10 rounded-2xl text-xs font-bold select-none cursor-default">
                  <span>{selectedDay} Menu</span>
                  <CalendarDays className="w-4 h-4 text-slate-300 absolute right-3.5 top-3.5 pointer-events-none" />
                </div>

              </div>
            </div>

            {/* Vendor Grid */}
            <div className="grid grid-cols-1 gap-4">
              {vendors.filter((vendor) => menuPackages.some((p) => p.vendorId === vendor.id)).length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-slate-500">
                  <p className="font-serif font-bold text-lg text-slate-700">No catering vendors available</p>
                  <p className="text-xs text-slate-400 mt-1">There are no catering vendors assigned for {mealTypeToggle === 'lunch' ? 'Lunch' : 'Dinner'} on {selectedDay}.</p>
                </div>
              ) : (
                vendors
                  .filter((vendor) => menuPackages.some((p) => p.vendorId === vendor.id))
                  .map((vendor) => {
                    const isExpanded = expandedVendorId === vendor.id;
                    // Get packages for this specific vendor
                    const vendorPkgs = menuPackages.filter(p => p.vendorId === vendor.id);

                return (
                  <div key={vendor.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs transition hover:shadow-sm">
                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={vendor.logoUrl}
                          alt={vendor.name}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif font-bold text-slate-900 text-base">{vendor.name}</h4>
                            {vendor.isFeatured && (
                              <span className="bg-orange-50 text-brand-orange text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Featured</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{vendor.tagline}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs font-mono font-bold text-brand-orange">
                            <Star className="w-3.5 h-3.5 fill-brand-orange text-brand-orange" />
                            {vendor.rating} / 5.0 Rating
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                        className={`px-5 py-2.5 font-bold rounded-xl text-xs transition active:scale-95 focus:outline-none w-full sm:w-auto text-center ${
                          isExpanded
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isExpanded ? 'Hide Menu Details' : "View Today's Menu"}
                      </button>
                    </div>

                    {/* Expandable Menu Details (Inline Accordion — No redirect) */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 bg-stone-50/50 pt-5 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                          <h5 className="text-xs font-serif font-bold uppercase text-slate-400 tracking-wider">
                            Menu for {selectedDay} — {mealTypeToggle.toUpperCase()}
                          </h5>
                          <span className="text-xs text-slate-500 italic">Prepaid order values calculated instantly</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {vendorPkgs.length === 0 ? (
                            <div className="col-span-3 py-6 text-center text-slate-400 text-xs italic">
                              This vendor is resting or has no packages configured for {mealTypeToggle} on {selectedDay}.
                            </div>
                          ) : (
                            vendorPkgs.map((pkg) => {
                              const qty = orderQuantities[pkg.id] || 5;
                              const currentPrice = pkg.discountPrice || pkg.price;
                              const originalPrice = pkg.price;
                              const hasDiscount = pkg.discountPrice && pkg.discountPrice < pkg.price;

                              return (
                                <div key={pkg.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between group transition hover:shadow-xs">
                                  {/* Card Image Banner */}
                                  <div className="h-32 bg-slate-100 relative overflow-hidden">
                                    <img
                                      src={vendor.logoUrl}
                                      alt={vendor.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-3">
                                      <div>
                                        <h4 className="text-white font-bold text-xs tracking-tight leading-tight">{vendor.name}</h4>
                                        <p className="text-[9px] text-slate-300 line-clamp-1">{vendor.tagline}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Rating Badge */}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-brand-orange font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                      <Star className="w-2.5 h-2.5 fill-brand-orange text-brand-orange" />
                                      {vendor.rating}
                                    </div>
                                  </div>

                                  {/* Package Details & Ordering Section */}
                                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                      <div className="flex justify-between items-start gap-2">
                                        <span className="text-[10px] bg-brand-green/10 font-bold px-2 py-0.5 rounded text-brand-green">
                                          {pkg.packageName}
                                        </span>
                                        <div className="text-right shrink-0">
                                          {hasDiscount && (
                                            <span className="text-[10px] text-brand-orange line-through font-mono block">৳{originalPrice}</span>
                                          )}
                                          <span className="font-mono text-xs font-black text-slate-800">৳{currentPrice}</span>
                                          <span className="text-[8px] text-slate-400 block font-mono">per meal</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-3 leading-relaxed bg-stone-50/50 p-2 rounded-lg border border-slate-100/40">
                                        {pkg.items}
                                      </p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 space-y-3">
                                      {/* Qty Selector */}
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-400">Qty:</span>
                                        <div className="flex items-center bg-stone-100 rounded-lg overflow-hidden border border-gray-200/50">
                                          <button
                                            onClick={() => setOrderQuantities({
                                              ...orderQuantities,
                                              [pkg.id]: Math.max(5, qty - 1)
                                            })}
                                            className="px-2.5 py-0.5 font-bold hover:bg-stone-200 text-slate-600 transition"
                                          >
                                            -
                                          </button>
                                          <span className="px-3 text-xs font-mono font-bold text-slate-700">{qty}</span>
                                          <button
                                            onClick={() => setOrderQuantities({
                                              ...orderQuantities,
                                              [pkg.id]: qty + 1
                                            })}
                                            className="px-2.5 py-0.5 font-bold hover:bg-stone-200 text-slate-600 transition"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      {/* Place Order button */}
                                      <button
                                        disabled={timerInfo.isClosed}
                                        onClick={() => handlePlaceOrder(vendor.id, pkg.id, mealTypeToggle)}
                                        className={`w-full font-bold py-2 rounded-xl text-xs transition focus:outline-none ${
                                          timerInfo.isClosed
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : 'bg-brand-green hover:bg-brand-green-hover text-white shadow-2xs active:scale-95'
                                        }`}
                                      >
                                        {timerInfo.isClosed ? 'Order Closed' : `Order ${qty} Meals — ৳${(currentPrice * qty).toLocaleString()}`}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Vendor Reviews Subsection */}
                        <div className="mt-6 border-t border-gray-100 pt-5 space-y-4">
                          <h5 className="text-xs font-serif font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-brand-green" />
                            Customer Ratings & Reviews
                          </h5>
                          {(!vendorReviews[vendor.id] || vendorReviews[vendor.id].length === 0) ? (
                            <p className="text-xs text-slate-400 italic">No reviews yet for this vendor. Be the first to leave a review after your order is delivered!</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {vendorReviews[vendor.id].map((rev) => (
                                <div key={rev.id} className="bg-white p-4 rounded-xl border border-gray-100/60 space-y-2 shadow-2xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-800">{rev.userName}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-0.5 text-brand-orange">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < rev.rating ? 'fill-brand-orange text-brand-orange' : 'text-slate-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                );
              })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER STATUS & STEPPER */}
        {currentTab === 'orders' && (
          <div className="space-y-6" id="tab-orders">
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">Active & Past Orders</h3>
              <p className="text-xs text-slate-500">Track and monitor your prepaid corporate dining statuses</p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-xl mx-auto space-y-4">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-slate-800">No Orders Found</h4>
                  <p className="text-slate-500 text-xs mt-1">You haven't placed any catering orders yet.</p>
                </div>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl text-xs shadow-sm transition active:scale-95 focus:outline-none"
                >
                  Browse Today's Menus
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isCooking = order.status === 'Cooking';
                  const isOnTheWay = order.status === 'On the way';
                  const isDelivered = order.status === 'Delivered';
                  const isCancelled = order.status === 'Cancelled';

                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                      
                      {/* Order top bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">ORDER ID: #{order.id}</span>
                            <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                              isCancelled 
                                ? 'bg-rose-100 text-rose-800' 
                                : isDelivered 
                                ? 'bg-brand-green/10 text-brand-green' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <h4 className="font-serif font-bold text-slate-900 text-base mt-1">
                            {order.quantity}x {order.packageName} — {order.vendorName}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Meal Type: <span className="font-semibold capitalize">{order.mealType}</span> • Date: {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
                          <span className="text-xs text-slate-400">Total Charged:</span>
                          <span className="font-mono text-lg font-black text-slate-800">৳{order.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Stepper Timeline UI */}
                      {!isCancelled ? (
                        <div className="py-2">
                          <div className="flex items-center justify-between relative max-w-lg mx-auto">
                            {/* Step progress lines */}
                            <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
                            <div className={`absolute left-6 top-1/2 h-0.5 bg-brand-green -translate-y-1/2 z-0 transition-all duration-500`}
                              style={{
                                width: isDelivered ? '100%' : isOnTheWay ? '50%' : '0%'
                              }}
                            />

                            {/* Cooking Step */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                isCooking || isOnTheWay || isDelivered
                                  ? 'bg-brand-green text-white ring-4 ring-brand-green/10'
                                  : 'bg-white text-gray-400 border border-gray-200'
                              }`}>
                                1
                              </div>
                              <span className="text-xs font-bold mt-2 text-slate-700">Cooking</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Kitchen prepping</span>
                            </div>

                            {/* On the Way Step */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                isOnTheWay || isDelivered
                                  ? 'bg-brand-green text-white ring-4 ring-brand-green/10'
                                  : isCooking
                                  ? 'bg-white text-brand-green border-2 border-brand-green ring-4 ring-stone-50'
                                  : 'bg-white text-gray-400 border border-gray-200'
                              }`}>
                                2
                              </div>
                              <span className="text-xs font-bold mt-2 text-slate-700">On the Way</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Delivery dispatched</span>
                            </div>

                            {/* Delivered Step */}
                            <div className="flex flex-col items-center relative z-10">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                isDelivered
                                  ? 'bg-brand-green text-white ring-4 ring-brand-green/10'
                                  : isOnTheWay
                                  ? 'bg-white text-brand-green border-2 border-brand-green ring-4 ring-stone-50'
                                  : 'bg-white text-gray-400 border border-gray-200'
                              }`}>
                                3
                              </div>
                              <span className="text-xs font-bold mt-2 text-slate-700">Delivered</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">Office counter</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-rose-50 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>This order was cancelled. BDT {order.totalPrice} has been credited back to your wallet.</span>
                        </div>
                      )}

                      {/* Cancel order actions */}
                      {isCooking && (
                        <div className="flex justify-end pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition active:scale-95 focus:outline-none"
                          >
                            Cancel Order & Refund BDT
                          </button>
                        </div>
                      )}

                      {/* Review order action */}
                      {isDelivered && (
                        <div className="pt-4 border-t border-gray-100">
                          {(order as any).isReviewed ? (
                            <div className="bg-stone-50 p-4 rounded-xl border border-gray-100/60 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Your Rating</span>
                                <div className="flex items-center gap-0.5 text-brand-orange">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < ((order as any).reviewRating || 0) ? 'fill-brand-orange text-brand-orange' : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {(order as any).reviewComment && (
                                <p className="text-xs text-slate-600 italic">"{(order as any).reviewComment}"</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <span className="text-xs text-slate-500">Order successfully delivered! Share your feedback.</span>
                              <button
                                onClick={() => handleOpenReviewModal(order)}
                                className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-bold rounded-xl transition active:scale-95 focus:outline-none flex items-center gap-1.5 shrink-0"
                              >
                                <Star className="w-3.5 h-3.5 fill-white text-white" />
                                Review Order
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEPOSIT WALLET & TRANSACTIONS */}
        {currentTab === 'deposit' && (
          <div className="space-y-6" id="tab-deposit">
            
            {/* Header */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">Prepaid Wallet</h3>
              <p className="text-xs text-slate-500">Fund your food wallet to place lunch or dinner bookings instantly</p>
            </div>

            {/* Wallet Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-[#0f1e36] to-brand-green rounded-3xl p-6 text-white shadow-md border border-brand-green/20 flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-300 font-mono tracking-wider uppercase">Meal100 Prepaid Card</span>
                    {withdrawPending ? (
                      <div className="mt-1">
                        <h4 className="text-2xl font-serif font-bold font-mono text-white">
                          ৳0.00
                        </h4>
                        <div className="mt-1.5 text-[10px] text-amber-300 font-bold font-mono bg-amber-500/10 px-2 py-1 rounded-lg inline-block border border-amber-500/20">
                          (Withdraw amount: ৳{withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (pending))
                        </div>
                      </div>
                    ) : (
                      <h4 className="text-2xl font-serif font-bold font-mono mt-1">
                        ৳{user ? user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                      </h4>
                    )}
                  </div>
                  <Coins className="w-8 h-8 text-brand-orange shrink-0" />
                </div>

                {/* Withdraw button directly following the balance section */}
                <div className="my-4">
                  {withdrawPending ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-red-600/40 border border-red-500/20 text-red-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                    >
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Withdraw request Pending
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (user && user.walletBalance > 0) {
                          setWithdrawReasonInput('');
                          setShowWithdrawModal(true);
                        } else {
                          setErrorMsg('You must have a balance greater than ৳0 to request a withdrawal.');
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition active:scale-95 shadow-xs hover:shadow-sm focus:outline-none flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      Request Withdraw
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300">
                  <p>{user?.name || 'GUEST USER'}</p>
                  <p className="font-mono">MIN DEP: ৳1000</p>
                </div>
              </div>

              {/* Deposit Form */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm col-span-1 md:col-span-2">
                <h4 className="font-bold text-slate-900 text-sm mb-4">Fast Wallet Deposit</h4>
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Enter Amount (BDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1000"
                        value={depositAmountInput}
                        onChange={(e) => setDepositAmountInput(e.target.value)}
                        placeholder="Min 1000"
                        className="w-full bg-stone-100 border border-gray-200 px-4 py-3.5 pl-10 rounded-2xl text-sm font-semibold text-slate-800 font-mono focus:outline-none focus:border-brand-green focus:bg-white"
                        required
                      />
                      <span className="absolute left-4 top-3.5 font-bold text-slate-400">৳</span>
                    </div>
                    <p className="text-[10px] text-slate-400">Core business rule: The minimum deposit allowed is ৳1000 BDT.</p>
                  </div>

                  {/* Payment presets */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['1000', '1500', '2500', '5000'].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setDepositAmountInput(preset)}
                        className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-lg text-xs transition font-mono focus:outline-none"
                      >
                        +৳{preset}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/50 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-md active:scale-95 focus:outline-none flex items-center justify-center gap-2"
                  >
                    {depositLoading ? 'Simulating payment gateway...' : 'Pay with bKash / Nagad'}
                  </button>
                </form>
              </div>

            </div>

            {/* Transaction History Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-serif font-bold text-slate-900 text-sm">Full Transaction Ledger</h4>
                  <p className="text-xs text-slate-500">Official logs of wallet funding, order charges, and refunds</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic">
                  No transaction ledger events recorded yet. Perform a wallet deposit to trigger logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-gray-100 text-slate-400 uppercase tracking-wider font-bold">
                        <th className="px-6 py-4">Event Date</th>
                        <th className="px-6 py-4">Transaction Type</th>
                        <th className="px-6 py-4 text-right">Amount (BDT)</th>
                        <th className="px-6 py-4 text-right">Running Balance</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4 text-center">Payslip Statement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {transactions.map((txn) => {
                        const isCredit = txn.amount >= 0;
                        return (
                          <tr key={txn.id} className="hover:bg-stone-50/50 transition">
                            <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                              {new Date(txn.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`p-1.5 rounded-lg shrink-0 ${
                                  isCredit ? 'bg-brand-green/10 text-brand-green' : 'bg-rose-50 text-brand-orange'
                                }`}>
                                  {isCredit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-800 capitalize block">{txn.type.replace('_', ' ')}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{txn.memo || 'Processed successfully'}</span>
                                </div>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap text-sm ${
                              isCredit ? 'text-brand-green' : 'text-brand-orange'
                            }`}>
                              {isCredit ? '+' : ''}৳{txn.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-slate-700 whitespace-nowrap text-sm">
                              ৳{txn.resultingBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono whitespace-nowrap">
                              {txn.gatewayRef}
                            </td>
                            <td className="px-6 py-4 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedPayslipTxn(txn)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 hover:bg-brand-green/15 text-brand-green font-bold rounded-lg text-[10px] transition focus:outline-none"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                Download Statement
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: EMPLOYEE PROFILE SETTINGS */}
        {currentTab === 'profile' && (
          <div className="space-y-6" id="tab-profile">
            
            {/* Header */}
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">Employee Profile Settings</h3>
              <p className="text-xs text-slate-500">Provide complete office registration info to verify your corporate account</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile completeness and Free Meal Incentive details */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Progress Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm">Profile Completeness</h4>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">{profileProgress}% Complete</span>
                      <span className="text-brand-green font-mono font-bold">{profileProgress === 100 ? 'Claimed' : 'Pending ৳200 Credit'}</span>
                    </div>
                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-green rounded-full transition-all duration-500"
                        style={{ width: `${profileProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Incentive Banner */}
                  {profileProgress < 100 ? (
                    <div className="p-4 bg-orange-50/80 rounded-2xl border border-orange-100 space-y-2 text-xs">
                      <div className="flex gap-2 text-brand-orange font-bold">
                        <Award className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                        <span>Get ৳200 Free Meal Credit!</span>
                      </div>
                      <p className="text-orange-800/80 leading-relaxed font-medium">
                        Fill in all fields below including an avatar link and office map coordinate to claim a one-time ৳200 bonus directly to your dining balance.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-brand-green rounded-2xl text-white space-y-1 text-xs text-center font-bold">
                      <p>🎉 All Profile Details Completed!</p>
                      <p className="font-normal text-white/90 text-[10px]">One-time ৳200 free meal has been auto-credited.</p>
                    </div>
                  )}
                </div>

                {/* Account Details Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-xs space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Corporate Verification</h4>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-slate-500">Phone Verification:</span>
                    <span className="text-brand-green font-bold bg-brand-green/10 px-2 py-0.5 rounded">VERIFIED OTP</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-slate-500">Employee Role:</span>
                    <span className="text-slate-700 uppercase font-mono font-bold bg-stone-100 px-2 py-0.5 rounded">{user?.role}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500">Registration Date:</span>
                    <span className="text-slate-700 font-mono">{user ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

              </div>

              {/* Form panel */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <form onSubmit={handleProfileSave} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Sanjidul Islam"
                        className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                        required
                      />
                    </div>

                    {/* Phone (Read Only) */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Registered Mobile (OTP Gate)</label>
                      <input
                        type="text"
                        value={user?.phone || ''}
                        disabled
                        className="w-full bg-slate-100/80 border border-slate-200/50 px-4 py-3 rounded-2xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Office Website or FB Link */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Office FB / Website Link</label>
                      <input
                        type="url"
                        value={profileOfficeLink}
                        onChange={(e) => setProfileOfficeLink(e.target.value)}
                        placeholder="https://facebook.com/my-office"
                        className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                      />
                    </div>

                    {/* Office Map Coordinate Link */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Office Google Maps Location</label>
                      <input
                        type="url"
                        value={profileOfficeMapLink}
                        onChange={(e) => setProfileOfficeMapLink(e.target.value)}
                        placeholder="https://maps.google.com/?q=Dhanmondi,Dhaka"
                        className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                      />
                    </div>

                  </div>

                  {/* Profile Image Preset Links */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Employee Photo (URL Link)</label>
                    <input
                      type="url"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                    />
                    
                    {/* Presets */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Or pick a preset avatar style:</span>
                      <div className="flex gap-3">
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=60',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=60',
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=60',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=60'
                        ].map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setProfileImage(img)}
                            className={`w-10 h-10 rounded-full border-2 overflow-hidden hover:scale-105 transition shrink-0 ${
                              profileImage === img ? 'border-brand-green ring-2 ring-brand-green/15' : 'border-gray-200'
                            }`}
                          >
                            <img src={img} alt="preset-pic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/50 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-md active:scale-95 focus:outline-none"
                  >
                    {profileSaving ? 'Saving profile events...' : 'Save & Claim Free Meal BDT'}
                  </button>

                </form>
              </div>

            </div>

          </div>
        )}

        {/* TAB 6: STATIC HELP & SUPPORT */}
        {currentTab === 'support' && (
          <div className="space-y-6 max-w-2xl mx-auto" id="tab-support">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Help & Corporate Support</h3>
              <p className="text-sm text-slate-500">Meal100 customer care desk operates 24/7 for catering support</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6 text-sm leading-relaxed">
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-slate-900 text-base border-b border-gray-100 pb-2">Business Information</h4>
                <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Office Address</span>
                  <span className="col-span-2 text-slate-700 font-medium">Plot 45, Road 27, Dhanmondi, Dhaka 1209, Bangladesh</span>

                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contact Number</span>
                  <span className="col-span-2 text-slate-700 font-mono font-semibold">+880 1722-222222</span>

                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">WhatsApp Live</span>
                  <span className="col-span-2 text-brand-green font-bold">
                    <a href="https://wa.me/8801722222222" target="_blank" rel="noreferrer" className="hover:underline">
                      +880 1722-222222
                    </a>
                  </span>

                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Support Hours</span>
                  <span className="col-span-2 text-slate-700 font-medium">9:00 AM – 9:00 PM (Everyday)</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-serif font-bold text-slate-900 text-base border-b border-gray-100 pb-2">Frequently Asked Questions</h4>
                
                <div className="space-y-3">
                  <div className="bg-stone-50 p-4 rounded-xl">
                    <p className="font-serif font-bold text-slate-800 text-xs mb-1">What happens if a vendor rejects my order or I cancel it?</p>
                    <p className="text-xs text-slate-500">
                      If an order is cancelled or rejected before delivery, the transaction is marked as a refund, and the full deducted BDT amount is automatically returned to your wallet balance.
                    </p>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-xl">
                    <p className="font-serif font-bold text-slate-800 text-xs mb-1">How can I withdraw my prepaid wallet balance?</p>
                    <p className="text-xs text-slate-500">
                      You can request a withdrawal directly from your prepaid card section in the Wallet tab by clicking "Request Withdraw" and entering a reason. Once submitted, your request will be pending review by the admin, and your active balance will show as zero.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ADMIN CONTROL PANEL (ROLE PROTECTED) */}
        {user?.role === 'admin' && currentTab === 'admin' && (
          <div className="space-y-6" id="tab-admin">
            <div>
              <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-brand-green" />
                Administrative Command Center
              </h3>
              <p className="text-xs text-slate-500">Configure vendors, manage packages, monitor orders, and audit prepaid transactions</p>
            </div>

            {/* Admin Sub Navigation tabs */}
            <div className="flex border-b border-gray-200 gap-4 overflow-x-auto pb-px">
              {[
                { id: 'orders', label: 'Monitor Orders' },
                { id: 'vendors', label: 'Catering Vendors' },
                { id: 'menu', label: 'Weekly Packages' },
                { id: 'deposits', label: 'Prepaid Audits & Users' },
                { id: 'reviews', label: 'Moderate Reviews' }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => {
                    setAdminSubTab(subTab.id as any);
                    setEditingVendor(null);
                    setEditingPackage(null);
                  }}
                  className={`py-3.5 px-2 text-xs font-bold border-b-2 transition whitespace-nowrap focus:outline-none ${
                    adminSubTab === subTab.id
                      ? 'border-brand-green text-brand-green'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {subTab.label}
                </button>
              ))}
            </div>

            {/* SUBTAB 1: ORDERS MONITOR */}
            {adminSubTab === 'orders' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="admin-orders">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h4 className="font-serif font-bold text-slate-900 text-sm">Active Orders Monitoring</h4>
                  <p className="text-xs text-slate-400">Advance order states or cancel for automated refunds</p>
                </div>

                {orders.length === 0 ? (
                  <p className="p-12 text-center text-slate-400 text-xs italic">No orders have been submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-gray-100 text-slate-400 font-bold uppercase">
                          <th className="px-6 py-3">Order ID</th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Caterer & Package</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3 text-right">Value (BDT)</th>
                          <th className="px-6 py-3">Current Status</th>
                          <th className="px-6 py-3 text-center">Update State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-slate-700">
                        {orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-stone-50/50">
                            <td className="px-6 py-4 font-mono text-slate-400">#{ord.id}</td>
                            <td className="px-6 py-4">
                              <div>
                                <span className="font-bold block text-slate-800">{ord.userName}</span>
                                <span className="text-[10px] text-slate-400 font-mono font-normal">UID: {ord.userId}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold block text-slate-800">{ord.vendorName}</span>
                              <span className="text-[10px] text-brand-green font-bold bg-brand-green/10 px-1.5 py-0.5 rounded">{ord.packageName}</span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800">{ord.quantity}</td>
                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-900">৳{ord.totalPrice}</td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                ord.status === 'Cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : ord.status === 'Delivered'
                                  ? 'bg-brand-green/10 text-brand-green'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {ord.status !== 'Cancelled' && ord.status !== 'Delivered' ? (
                                <div className="inline-flex gap-1">
                                  {ord.status === 'Cooking' && (
                                    <button
                                      onClick={() => handleAdminStatusChange(ord.id, 'On the way')}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] transition focus:outline-none"
                                    >
                                      Mark On the Way
                                    </button>
                                  )}
                                  {ord.status === 'On the way' && (
                                    <button
                                      onClick={() => handleAdminStatusChange(ord.id, 'Delivered')}
                                      className="px-2.5 py-1 bg-brand-green/10 hover:bg-brand-green/15 text-brand-green font-bold rounded-lg text-[10px] transition focus:outline-none"
                                    >
                                      Mark Delivered
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAdminStatusChange(ord.id, 'Cancelled')}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition focus:outline-none"
                                  >
                                    Cancel & Refund
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono text-[10px]">No Actions</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: CATERING VENDORS */}
            {adminSubTab === 'vendors' && (
              <div className="space-y-6" id="admin-vendors">
                
                {/* Form to create/edit */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-4">
                    {editingVendor?.id ? 'Edit Vendor Node' : 'Add New Catering House'}
                  </h4>
                  <form onSubmit={handleAdminSaveVendor} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Vendor Name</label>
                        <input
                          type="text"
                          value={editingVendor?.name || ''}
                          onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                          placeholder="e.g. Sultan's Dine"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Logo / Photo Image URL</label>
                        <input
                          type="url"
                          value={editingVendor?.logoUrl || ''}
                          onChange={(e) => setEditingVendor({ ...editingVendor, logoUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono focus:outline-none focus:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Short Tagline</label>
                        <input
                          type="text"
                          value={editingVendor?.tagline || ''}
                          onChange={(e) => setEditingVendor({ ...editingVendor, tagline: e.target.value })}
                          placeholder="Legendary Kacchi Biryani"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-end pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                          <input
                            type="checkbox"
                            checked={!!editingVendor?.isFeatured}
                            onChange={(e) => setEditingVendor({ ...editingVendor, isFeatured: e.target.checked })}
                            className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                          />
                          Featured on Home Top-3
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2 rounded-xl text-xs transition active:scale-95"
                          >
                            Save Vendor
                          </button>
                          {editingVendor && (
                            <button
                              type="button"
                              onClick={() => setEditingVendor(null)}
                              className="px-3 bg-stone-200 hover:bg-stone-300 text-slate-700 font-bold rounded-xl text-xs transition"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-gray-100 text-slate-400 font-bold uppercase">
                        <th className="px-6 py-3">Vendor Image</th>
                        <th className="px-6 py-3">Vendor Name</th>
                        <th className="px-6 py-3">Tagline</th>
                        <th className="px-6 py-3">Home Feature</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {vendors.map((v) => (
                        <tr key={v.id} className="hover:bg-stone-50/50">
                          <td className="px-6 py-3">
                            <img src={v.logoUrl} alt="" className="w-10 h-10 object-cover rounded-lg border" referrerPolicy="no-referrer" />
                          </td>
                          <td className="px-6 py-3 font-bold text-slate-800">{v.name}</td>
                          <td className="px-6 py-3 text-slate-500">{v.tagline}</td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              v.isFeatured ? 'bg-orange-50 text-brand-orange' : 'bg-stone-100 text-slate-400'
                            }`}>
                              {v.isFeatured ? 'YES (TOP 3)' : 'NO'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center space-x-2">
                            <button
                              onClick={() => setEditingVendor(v)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdminDeleteVendor(v.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* SUBTAB 3: WEEKLY PACKAGES */}
            {adminSubTab === 'menu' && (
              <div className="space-y-6" id="admin-packages">
                
                {/* Form to create/edit package */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-4">
                    {editingPackage?.id ? 'Edit Weekly Package' : 'Create Weekly Package Node'}
                  </h4>
                  <form onSubmit={handleAdminSavePackage} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Vendor</label>
                        <select
                          value={editingPackage?.vendorId || ''}
                          onChange={(e) => setEditingPackage({ ...editingPackage, vendorId: e.target.value })}
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        >
                          <option value="">Select Vendor</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Day of Week</label>
                        <select
                          value={editingPackage?.dayOfWeek || 'Monday'}
                          onChange={(e) => setEditingPackage({ ...editingPackage, dayOfWeek: e.target.value })}
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        >
                          {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Meal Type</label>
                        <select
                          value={editingPackage?.mealType || 'lunch'}
                          onChange={(e) => setEditingPackage({ ...editingPackage, mealType: e.target.value as MealType })}
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        >
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Package Name</label>
                        <input
                          type="text"
                          value={editingPackage?.packageName || ''}
                          onChange={(e) => setEditingPackage({ ...editingPackage, packageName: e.target.value })}
                          placeholder="e.g. Classic Beef Polao"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Items Included (Comma-separated)</label>
                        <input
                          type="text"
                          value={editingPackage?.items || ''}
                          onChange={(e) => setEditingPackage({ ...editingPackage, items: e.target.value })}
                          placeholder="Kacchi Rice, Beef Shami, Salad, Drink"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Original Price (৳)</label>
                        <input
                          type="number"
                          value={editingPackage?.price || ''}
                          onChange={(e) => setEditingPackage({ ...editingPackage, price: Number(e.target.value) })}
                          placeholder="240"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-brand-green"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Discount Price (৳)</label>
                        <input
                          type="number"
                          value={editingPackage?.discountPrice || ''}
                          onChange={(e) => setEditingPackage({ ...editingPackage, discountPrice: Number(e.target.value) })}
                          placeholder="199"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-brand-green"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="bg-brand-green hover:bg-brand-green-hover text-white font-bold py-2.5 px-6 rounded-xl text-xs transition active:scale-95"
                      >
                        Save Package Node
                      </button>
                      {editingPackage && (
                        <button
                          type="button"
                          onClick={() => setEditingPackage(null)}
                          className="px-4 bg-stone-200 hover:bg-stone-300 text-slate-700 font-bold rounded-xl text-xs transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 bg-stone-50 border-b border-gray-100 text-slate-400 text-xs font-bold uppercase">
                    All Weekly Menu Database
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100 text-slate-400 font-bold uppercase sticky top-0">
                          <th className="px-4 py-3">Vendor</th>
                          <th className="px-4 py-3">Weekday</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Package Name</th>
                          <th className="px-4 py-3">Original / Discount Price</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {menuPackages.map((p) => {
                          const v = vendors.find(vend => vend.id === p.vendorId);
                          return (
                            <tr key={p.id} className="hover:bg-stone-50/50">
                              <td className="px-4 py-3 text-slate-800 font-bold">{v ? v.name : 'Unknown'}</td>
                              <td className="px-4 py-3 text-slate-600 font-semibold">{p.dayOfWeek}</td>
                              <td className="px-4 py-3 uppercase text-[9px] font-black text-brand-green font-mono">{p.mealType}</td>
                              <td className="px-4 py-3 text-slate-500">
                                <span className="font-bold text-slate-800 block">{p.packageName}</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1 font-normal">{p.items}</span>
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <span className="text-slate-400 line-through">৳{p.price}</span>
                                <span className="text-brand-green font-bold ml-2">৳{p.discountPrice || p.price}</span>
                              </td>
                              <td className="px-4 py-3 text-center space-x-2 whitespace-nowrap">
                                <button
                                  onClick={() => setEditingPackage(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAdminDeletePackage(p.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* SUBTAB 4: PREPAID AUDITS & REGISTERED USERS */}
            {adminSubTab === 'deposits' && (
              <div className="space-y-6" id="admin-users-balances">
                
                {/* Withdrawal Requests Manager Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="admin-withdrawals-card">
                  <div className="px-6 py-5 border-b border-gray-100 bg-stone-50/50">
                    <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Coins className="w-5 h-5 text-brand-orange" />
                      Employee Withdrawal Requests Manager
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Audit and process user balance cash-out request queues. Approving finalizes the transfer, while rejecting refunds BDT instantly back to their active prepaid card.
                    </p>
                  </div>

                  {adminWithdrawalsLoading ? (
                    <p className="p-12 text-center text-slate-400 text-xs italic">Loading withdrawal requests...</p>
                  ) : adminWithdrawals.length === 0 ? (
                    <p className="p-12 text-center text-slate-400 text-xs italic">No withdrawal requests submitted yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-100 border-b border-gray-200 text-slate-400 font-bold uppercase">
                            <th className="px-6 py-3">Employee Name</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3 text-right">Requested Amount</th>
                            <th className="px-6 py-3">Withdrawal Reason</th>
                            <th className="px-6 py-3">Submission Date</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {adminWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-stone-50/30">
                              <td className="px-6 py-4 font-bold text-slate-800">{w.userName}</td>
                              <td className="px-6 py-4 font-mono text-slate-500">{w.userPhone}</td>
                              <td className="px-6 py-4 text-right font-mono text-brand-green font-bold text-sm">
                                ৳{w.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={w.reason}>
                                {w.reason}
                              </td>
                              <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                                {new Date(w.createdAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  w.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  w.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {w.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {w.status === 'pending' ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleAdminWithdrawalStatus(w.id, 'approved')}
                                      className="px-3 py-1.5 bg-brand-green hover:bg-brand-green-hover text-white text-[11px] font-bold rounded-lg transition active:scale-95 shadow-3xs"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAdminWithdrawalStatus(w.id, 'rejected')}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition active:scale-95 shadow-3xs"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-bold capitalize italic">
                                    Processed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Manual balance adjustment form with Audit log */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-4">Manual Balance Adjustment Audit Form</h4>
                  <form onSubmit={handleAdminAdjustBalance} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Target Employee</label>
                        <select
                          value={manualAdjustmentUser}
                          onChange={(e) => setManualAdjustmentUser(e.target.value)}
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green"
                          required
                        >
                          <option value="">Select User</option>
                          {adminUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name || 'Set Name'} ({u.phone}) — Bal: ৳{u.walletBalance}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Adjustment Amount (৳)</label>
                        <input
                          type="number"
                          value={manualAdjustmentAmount}
                          onChange={(e) => setManualAdjustmentAmount(e.target.value)}
                          placeholder="e.g. -500 or 1500"
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-brand-green focus:bg-white"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Reason / Audit Trail Log</label>
                        <input
                          type="text"
                          value={manualAdjustmentMemo}
                          onChange={(e) => setManualAdjustmentMemo(e.target.value)}
                          placeholder="Manual refund, dietary allowance adjustment..."
                          className="w-full bg-stone-100 border border-gray-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-green focus:bg-white"
                          required
                        />
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 rounded-xl text-xs transition shadow-sm active:scale-95"
                    >
                      Process Audit adjustment & Save Log
                    </button>
                  </form>
                </div>

                {/* Users List with free meal claimed statuses */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 bg-stone-50 border-b border-gray-100 font-serif font-bold text-slate-900 text-sm">
                    Prepaid Balance Audits (Employee Listing)
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-stone-100 border-b border-gray-200 text-slate-400 font-bold uppercase">
                        <th className="px-6 py-3">Employee Name</th>
                        <th className="px-6 py-3">Phone</th>
                        <th className="px-6 py-3 text-right">Wallet Balance</th>
                        <th className="px-6 py-3 text-center">Profile Progress</th>
                        <th className="px-6 py-3 text-center">Free Meal Claimed</th>
                        <th className="px-6 py-3">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {adminUsers.map((u) => {
                        let fillCount = 0;
                        if (u.name) fillCount += 20;
                        if (u.phone) fillCount += 20;
                        if (u.officeLink) fillCount += 20;
                        if (u.officeMapLink) fillCount += 20;
                        if (u.profileImage) fillCount += 20;

                        return (
                          <tr key={u.id} className="hover:bg-stone-50/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={u.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=60'} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                                <div>
                                  <span className="font-bold text-slate-800 block">{u.name || 'Not Completed'}</span>
                                  <span className="text-[10px] text-slate-400 uppercase font-mono">{u.role}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500">{u.phone}</td>
                            <td className="px-6 py-4 text-right font-mono text-brand-green font-bold text-sm">৳{u.walletBalance.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                fillCount === 100 ? 'bg-brand-green/10 text-brand-green' : 'bg-stone-100 text-slate-500'
                              }`}>
                                {fillCount}% Done
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.freeMealClaimed ? 'bg-brand-green/10 text-brand-green' : 'bg-stone-100 text-slate-400'
                              }`}>
                                {u.freeMealClaimed ? 'CLAIMED ৳200' : 'PENDING'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* SUBTAB 5: REVIEWS MODERATION */}
            {adminSubTab === 'reviews' && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="admin-reviews">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 text-sm">Customer Reviews Moderation</h4>
                    <p className="text-xs text-slate-400">Approve, hide, or delete vendor reviews to keep quality high</p>
                  </div>
                  <button
                    onClick={fetchAdminReviews}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold rounded-lg text-xs transition"
                  >
                    Refresh Reviews
                  </button>
                </div>

                {adminReviewsLoading ? (
                  <div className="p-12 text-center text-slate-400 text-xs italic">Loading customer feedback logs...</div>
                ) : adminReviews.length === 0 ? (
                  <p className="p-12 text-center text-slate-400 text-xs italic">No ratings or reviews have been submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-gray-100 text-slate-400 font-bold uppercase">
                          <th className="px-6 py-3">Vendor</th>
                          <th className="px-6 py-3">User</th>
                          <th className="px-6 py-3">Rating</th>
                          <th className="px-6 py-3">Review Comment</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminReviews.map((rev) => (
                          <tr key={rev.id} className="hover:bg-stone-50/50 border-b border-gray-100/50">
                            <td className="px-6 py-4 font-bold text-slate-800">{rev.vendorName}</td>
                            <td className="px-6 py-4 font-medium text-slate-600">{rev.userName}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-0.5 text-brand-orange">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < rev.rating ? 'fill-brand-orange text-brand-orange' : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs truncate text-slate-500 italic">
                              "{rev.comment}"
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rev.isHidden ? 'bg-rose-50 text-rose-700' : 'bg-brand-green/10 text-brand-green'
                              }`}>
                                {rev.isHidden ? 'HIDDEN (FLAGGED)' : 'VISIBLE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleAdminToggleHideReview(rev.id)}
                                className={`px-2.5 py-1.5 font-bold rounded-lg text-[10px] transition focus:outline-none ${
                                  rev.isHidden
                                    ? 'bg-brand-green/10 hover:bg-brand-green/15 text-brand-green'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                }`}
                              >
                                {rev.isHidden ? 'Show Review' : 'Hide / Flag'}
                              </button>
                              <button
                                onClick={() => handleAdminDeleteReview(rev.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition focus:outline-none"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Persistent Floating support button */}
      <FloatingWhatsApp />

      {/* OTP Gate Modal */}
      {otpStep !== 'none' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="otp-auth-modal">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            
            {/* Modal header with support */}
            <div className="bg-gradient-to-r from-stone-900 to-brand-green p-6 text-white text-center relative">
              <button 
                onClick={() => {
                  setOtpStep('none');
                  setPendingAction(null);
                }} 
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-xl tracking-tight text-white">Verification Center</h3>
              <p className="text-slate-300 text-xs mt-1">Authenticate securely with OTP (One-Time Password)</p>
            </div>

            <div className="p-6 space-y-4">
              
              {otpStep === 'phone' && (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Employee Mobile Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        placeholder="e.g. 01722222222"
                        className="w-full bg-stone-100 border border-gray-200 px-4 py-3 pl-14 rounded-2xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                        required
                        autoFocus
                      />
                      <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">+880</span>
                    </div>
                    <p className="text-[10px] text-slate-400">We will instantly log you in or create a secure workspace account.</p>
                  </div>

                  {/* Dev Sandbox Guide */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-dashed text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">💡 AI Studio Developer Hint:</p>
                    <p>Enter any Bangladeshi mobile number. We will generate a mock OTP code in the console and auto-inject it in the success alert for an instant login!</p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-300 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-sm active:scale-95 focus:outline-none"
                  >
                    {otpLoading ? 'Requesting gateway check...' : 'Send Verification OTP'}
                  </button>
                </form>
              )}

              {otpStep === 'verify' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Verify 6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-center text-lg font-mono font-black tracking-widest text-slate-800 focus:outline-none focus:border-brand-green focus:bg-white"
                      required
                      autoFocus
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Expires in 5 minutes</span>
                      <button type="button" onClick={() => setOtpStep('phone')} className="text-brand-green font-bold hover:underline">
                        Change phone number
                      </button>
                    </div>
                  </div>

                  {debugOtp && (
                    <div className="p-3.5 bg-stone-100 rounded-xl border border-gray-200 flex items-center justify-between">
                      <div className="text-[10px] text-slate-700">
                        <span className="font-bold block">Developer OTP Generated:</span>
                        <span className="font-mono text-xs font-black block mt-0.5 tracking-wider text-brand-green">{debugOtp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(debugOtp)}
                        className="px-3 py-1.5 bg-brand-green text-white font-bold text-[10px] rounded-lg shadow-2xs hover:bg-brand-green-hover transition"
                      >
                        Auto-fill Code
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-300 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-sm active:scale-95 focus:outline-none"
                  >
                    {otpLoading ? 'Authorizing token access...' : 'Verify & Resume Activity'}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Download Payslip modal */}
      {selectedPayslipTxn && user && (
        <PayslipModal
          transaction={selectedPayslipTxn}
          user={user}
          onClose={() => setSelectedPayslipTxn(null)}
        />
      )}

      {/* Withdraw Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="withdraw-request-modal">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-[#0f1e36] p-6 text-white text-center relative">
              <button 
                onClick={() => setShowWithdrawModal(false)} 
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-xl tracking-tight text-white">Withdrawal Request</h3>
              <p className="text-slate-300 text-xs mt-1">Please provide the details below for your refund</p>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Withdrawal Amount</label>
                <div className="bg-stone-100 border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Eligible BDT Balance</span>
                  <span className="font-mono font-black text-slate-800 text-lg">৳{user ? user.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Withdrawal Reason <span className="text-red-500">*</span></label>
                <textarea
                  required
                  value={withdrawReasonInput}
                  onChange={(e) => setWithdrawReasonInput(e.target.value)}
                  placeholder="Enter detailed reason (e.g., leaving company, excess balance, mistaken deposit)..."
                  className="w-full bg-stone-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white min-h-[100px] leading-relaxed resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-md active:scale-95 focus:outline-none flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm withdraw
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review & Rating Modal */}
      {reviewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="review-submission-modal">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-green to-[#0f1e36] p-6 text-white text-center relative">
              <button 
                onClick={() => setReviewingOrder(null)} 
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-serif font-bold text-xl tracking-tight text-white">Rate Your Meal</h3>
              <p className="text-slate-300 text-xs mt-1">Reviewing order #{reviewingOrder.id} from {reviewingOrder.vendorName}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
              {/* Rating selection (Interactive Stars!) */}
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Rate the quality (1 to 5 Stars)</label>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 hover:scale-110 transition duration-150 focus:outline-none"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          star <= reviewRating 
                            ? 'fill-brand-orange text-brand-orange animate-pulse' 
                            : 'text-slate-200 hover:text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-brand-orange font-mono">
                  {reviewRating === 5 ? 'Excellent 🌟🌟🌟🌟🌟' :
                   reviewRating === 4 ? 'Very Good 🌟🌟🌟🌟' :
                   reviewRating === 3 ? 'Good / Average 🌟🌟🌟' :
                   reviewRating === 2 ? 'Fair 🌟🌟' : 'Poor / Needs Improvement 🌟'}
                </p>
              </div>

              {/* Text review comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Tell us your feedback</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the food quality, taste, temperature, packaging, and quantity? Your constructive review helps caterers maintain standard meal qualities."
                  className="w-full bg-stone-100 border border-gray-200 px-4 py-3 rounded-2xl text-xs font-semibold focus:outline-none focus:border-brand-green focus:bg-white min-h-[100px] leading-relaxed resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingOrder(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="flex-1 bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-300 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-sm active:scale-95 focus:outline-none"
                >
                  {reviewLoading ? 'Posting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Booking Confirmation & Balance Calculation Modal */}
      {confirmingOrderData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="order-confirm-calculation-modal">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-green to-[#0f1e36] p-6 text-white text-center relative">
              <button 
                onClick={() => setConfirmingOrderData(null)} 
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex justify-center mb-2">
                {confirmingOrderData.mealType === 'lunch' ? (
                  <div className="bg-amber-400/20 p-2 rounded-full">
                    <Sun className="w-8 h-8 text-amber-400 fill-amber-100" />
                  </div>
                ) : (
                  <div className="bg-indigo-400/20 p-2 rounded-full">
                    <Moon className="w-8 h-8 text-indigo-400 fill-indigo-100" />
                  </div>
                )}
              </div>
              <h3 className="font-serif font-bold text-xl tracking-tight text-white">Confirm Your Order</h3>
              <p className="text-slate-300 text-xs mt-1">Please verify your booking details and wallet calculation</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Caterer</span>
                  <span className="text-xs font-semibold text-slate-800 text-right">{confirmingOrderData.vendorName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Package</span>
                  <span className="text-xs font-semibold text-slate-800 text-right">{confirmingOrderData.packageName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Meal Service</span>
                  <span className="text-xs font-semibold text-slate-800 capitalize text-right">{confirmingOrderData.mealType}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Quantity</span>
                  <span className="text-xs font-mono font-bold text-brand-green text-right">{confirmingOrderData.qty} Meals</span>
                </div>
                <div className="flex justify-between items-start border-t border-dashed border-slate-200 pt-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Price per Meal</span>
                  <span className="text-xs font-mono font-bold text-slate-700 text-right">৳{confirmingOrderData.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Account Next Calculation */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Next Calculation</h4>
                
                <div className="bg-stone-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Current Wallet Balance</span>
                    <span className="font-mono font-medium text-slate-700">৳{confirmingOrderData.currentBalance.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-rose-600">
                    <span className="flex items-center gap-1">
                      Total Booking Cost
                    </span>
                    <span className="font-mono font-bold">- ৳{confirmingOrderData.totalCost.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Remaining Balance (Next)</span>
                    <span className="font-mono text-sm font-black text-brand-green">৳{confirmingOrderData.newBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingOrderData(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs transition focus:outline-none"
                  disabled={confirmingLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={confirmingLoading}
                  className="flex-1 bg-brand-green hover:bg-brand-green-hover disabled:bg-stone-300 text-white font-bold py-3.5 rounded-2xl text-xs transition shadow-sm active:scale-95 focus:outline-none flex items-center justify-center gap-2"
                >
                  {confirmingLoading ? 'Submitting...' : 'Confirm Order'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
