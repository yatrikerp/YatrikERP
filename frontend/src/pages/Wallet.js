import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  CreditCard, 
  TrendingUp, 
  Gift, 
  ArrowDownRight, 
  Eye, 
  EyeOff,
  Plus,
  Download,
  Filter,
  Search,
  History,
  TrendingDown,
  ArrowUpRight,
  RefreshCw,
  Shield,
  Zap,
  Star
} from 'lucide-react';
import toast from 'react-hot-toast';

const Wallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real wallet data from database
  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch wallet balance
      const balanceRes = await apiFetch('/api/wallet/balance');
      if (balanceRes.ok) {
        setBalance(balanceRes.data.balance || 0);
      }

      // Fetch wallet transactions
      const transactionsRes = await apiFetch('/api/wallet/transactions');
      if (transactionsRes.ok) {
        setTransactions(transactionsRes.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'transport':
        return <TrendingUp className="w-5 h-5 text-blue-600" />;
      case 'bonus':
        return <Gift className="w-5 h-5 text-green-600" />;
      case 'refund':
        return <ArrowDownRight className="w-5 h-5 text-purple-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const quickActions = [
    { icon: <Plus className="w-6 h-6" />, label: 'Add Money', action: () => console.log('Add Money') },
    { icon: <CreditCard className="w-6 h-6" />, label: 'Cards', action: () => console.log('Cards') },
    { icon: <History className="w-6 h-6" />, label: 'History', action: () => console.log('History') },
    { icon: <Gift className="w-6 h-6" />, label: 'Rewards', action: () => console.log('Rewards') }
  ];

  const walletStats = [
    { label: 'Total Spent', value: '₹8,500', change: '+12%', trend: 'up', color: 'text-blue-600' },
    { label: 'Savings', value: '₹3,200', change: '+8%', trend: 'up', color: 'text-green-600' },
    { label: 'Rewards', value: '₹1,800', change: '+25%', trend: 'up', color: 'text-purple-600' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span>{showBalance ? 'Hide' : 'Show'} Balance</span>
            </button>
          </div>
          
          {/* Balance Display */}
          <div className="text-center">
            <p className="text-gray-600 mb-2">Available Balance</p>
            <div className="text-4xl font-bold text-gray-900 mb-4">
              {showBalance ? formatCurrency(balance) : '****'}
            </div>
            <div className="flex justify-center space-x-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add Money
              </button>
              <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Withdraw
              </button>
              </div>
              </div>
            </div>

            {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {quickActions.map((action, index) => (
            <button
                key={index}
              onClick={action.action}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-blue-600 mb-2">{action.icon}</div>
              <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </button>
            ))}
          </div>

        {/* Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {walletStats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-right ${stat.color}`}>
                  <p className="text-sm font-medium">{stat.change}</p>
                  <p className="text-xs">This month</p>
                </div>
              </div>
                        </div>
                    ))}
                </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
              </div>
              
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
                {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.date} • {transaction.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
