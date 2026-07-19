import React from 'react';
import { Printer, X, FileText } from 'lucide-react';
import { Transaction, User } from '../types';

interface PayslipModalProps {
  transaction: Transaction;
  user: User;
  onClose: () => void;
}

export default function PayslipModal({ transaction, user, onClose }: PayslipModalProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('printable-payslip-area');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '', 'height=650,width=900');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Meal100 Transaction Payslip</title>');
      // Inject Tailwind CSS reference
      printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      printWindow.document.write('</head><body class="p-8 bg-white text-gray-800">');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-green" />
            <h3 className="font-serif font-bold text-gray-800">Transaction Statement</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="printable-payslip-area" className="p-8 flex-1">
          <div className="border border-gray-200 rounded-xl p-6 bg-stone-50/50">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-serif font-bold text-brand-green tracking-tight">Meal100</h1>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Office Meals Simplified</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">Dhanmondi, Dhaka, Bangladesh</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-brand-green/10 text-brand-green text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
                  {transaction.type === 'deposit' ? 'DEPOSIT RECEIPT' : transaction.type === 'free_meal' ? 'PROMO BONUS' : 'ORDER DEBIT'}
                </span>
                <p className="text-xs text-gray-400 font-mono">REF: {transaction.gatewayRef}</p>
                <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
              </div>
            </div>

            {/* Billed To */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">User Details</h4>
                <p className="font-semibold text-gray-800">{user.name || 'Registered Employee'}</p>
                <p className="text-gray-600 font-mono text-xs">{user.phone}</p>
                {user.officeLink && (
                  <p className="text-gray-500 text-xs mt-0.5 truncate">{user.officeLink}</p>
                )}
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Method</h4>
                <p className="font-medium text-gray-800">
                  {transaction.type === 'deposit' ? 'bKash/Nagad Online' : transaction.type === 'free_meal' ? 'Profile Benefit' : 'Prepaid Wallet'}
                </p>
                <p className="text-xs text-brand-green font-semibold mt-1">Status: Success</p>
              </div>
            </div>

            {/* Transaction Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-gray-300 text-gray-400 text-xs uppercase text-left">
                  <th className="py-2 font-bold tracking-wider">Description</th>
                  <th className="py-2 text-right font-bold tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="text-gray-700">
                  <td className="py-3">
                    <p className="font-medium text-gray-800">
                      {transaction.memo || (transaction.type === 'deposit' ? 'Prepaid Wallet Funding' : 'Meal Ordering Debit')}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">Date: {formattedDate}</p>
                  </td>
                  <td className={`py-3 text-right font-semibold font-mono ${transaction.amount >= 0 ? 'text-brand-green' : 'text-brand-orange'}`}>
                    {transaction.amount >= 0 ? '+' : ''}৳{transaction.amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Balances */}
            <div className="border-t-2 border-dashed border-gray-200 pt-4 flex flex-col items-end text-sm gap-2">
              <div className="flex justify-between w-full max-w-[240px]">
                <span className="text-gray-500">Transaction Amount:</span>
                <span className="font-mono font-semibold text-gray-800">৳{Math.abs(transaction.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-800">Wallet Balance:</span>
                <span className="font-mono font-bold text-brand-green text-base">৳{transaction.resultingBalance.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 border-t border-gray-100 pt-4 text-center">
              <p className="text-[10px] text-gray-400">Thank you for dining with Meal100. For support, please reach out to support@meal100.com</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition active:scale-95 focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green-hover rounded-xl transition flex items-center gap-2 shadow-sm hover:shadow active:scale-95 focus:outline-none"
          >
            <Printer className="w-4 h-4" />
            Print Payslip
          </button>
        </div>
      </div>
    </div>
  );
}
