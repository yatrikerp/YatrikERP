import React from 'react';
import { Wallet, CreditCard, QrCode, Plus, TrendingUp } from 'lucide-react';

const WalletCard = ({ walletData, onAddMoney, onShowQRPass }) => {
  const defaultWallet = {
    balance: 1250.00,
    currency: '₹',
    activePasses: 2,
    totalSpent: 3450.00,
    concessions: 150.00
  };

  const data = walletData || defaultWallet;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Wallet & Passes</h3>
              <p className="text-gray-500 text-sm">Manage your balance & passes</p>
            </div>
          </div>
          <button
            onClick={onAddMoney}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Balance Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-gray-900">
                {data.currency}{data.balance.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900">
                {data.currency}{data.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Active Passes</span>
            </div>
            <p className="text-xl font-bold text-blue-900">{data.activePasses}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">Concessions</span>
            </div>
            <p className="text-xl font-bold text-orange-900">
              {data.currency}{data.concessions.toFixed(2)}
            </p>
          </div>
        </div>

        {/* QR Pass Button */}
        <button
          onClick={onShowQRPass}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5" />
          Show Digital Pass
        </button>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200">
            Add Money
          </button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200">
            View History
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;


