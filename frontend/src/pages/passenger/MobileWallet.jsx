import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Wallet,
  CreditCard,
  ArrowUp,
  ArrowDown,
  History,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';

const MobilePassengerWallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletData, setWalletData] = useState({
    balance: 1250,
    transactions: [],
    isLoading: true
  });
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setWalletData({
          balance: 1250,
          transactions: [
            {
              id: 1,
              type: 'credit',
              amount: 500,
              description: 'Trip Refund - Kochi to Bangalore',
              date: '2024-01-15',
              time: '14:30',
              status: 'completed'
            },
            {
              id: 2,
              type: 'debit',
              amount: 850,
              description: 'Bus Booking - Kochi to Chennai',
              date: '2024-01-14',
              time: '10:15',
              status: 'completed'
            },
            {
              id: 3,
              type: 'credit',
              amount: 200,
              description: 'Cashback - Weekend Travel',
              date: '2024-01-12',
              time: '16:45',
              status: 'completed'
            },
            {
              id: 4,
              type: 'debit',
              amount: 450,
              description: 'Bus Booking - Kochi to Thiruvananthapuram',
              date: '2024-01-10',
              time: '08:20',
              status: 'completed'
            }
          ],
          isLoading: false
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setWalletData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Wallet Balance</h2>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-lg hover:bg-white/20"
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-3xl font-bold mb-2">
          {showBalance ? formatAmount(walletData.balance) : '••••••'}
        </div>
        <p className="text-pink-100 text-sm">Available for booking</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 border border-gray-200 rounded-lg hover:border-pink-500 transition-all text-center">
            <Plus className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Money</span>
          </button>
          <button className="p-3 border border-gray-200 rounded-lg hover:border-pink-500 transition-all text-center">
            <Minus className="w-6 h-6 text-pink-500 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-sm text-pink-500 font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {walletData.transactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'credit' ? (
                    <ArrowDown className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                </p>
                <p className="text-xs text-gray-500">{transaction.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">All Transactions</h3>
        <div className="space-y-3">
          {walletData.transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'credit' ? (
                    <ArrowDown className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowUp className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(transaction.date)}</span>
                    <Clock className="w-3 h-3" />
                    <span>{transaction.time}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                </p>
                <p className="text-xs text-gray-500">{transaction.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" style={{ width: '100vw', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowUp className="w-4 h-4 text-gray-600 rotate-90" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900">My Wallet</h1>
              <p className="text-sm text-gray-600">Manage your payments</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <History className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[56px] z-40">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-pink-500 text-pink-500 bg-pink-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-sm font-medium">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'transactions'
                ? 'border-pink-500 text-pink-500 bg-pink-50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-sm font-medium">Transactions</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {walletData.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            <span className="ml-3 text-gray-600">Loading wallet...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'transactions' && renderTransactions()}
          </>
        )}
      </div>
    </div>
  );
};

export default MobilePassengerWallet;

