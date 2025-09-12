import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { 
  ArrowLeft, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet as WalletIcon,
  ArrowRight
} from 'lucide-react';

const Wallet = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    // For now, use mock data since wallet APIs don't exist yet
    // TODO: Replace with actual API calls when backend endpoints are ready
    const mockTransactions = [
      {
        id: 1,
        type: 'credit',
        amount: 1000,
        description: 'Wallet Top-up',
        method: 'UPI',
        status: 'completed',
        date: '2024-12-15T10:30:00',
        reference: 'TXN123456789'
      },
      {
        id: 2,
        type: 'debit',
        amount: 500,
        description: 'Bus Ticket Booking',
        method: 'Wallet',
        status: 'completed',
        date: '2024-12-15T14:30:00',
        reference: 'BK20241215001',
        trip: 'Kochi → Thiruvananthapuram'
      },
      {
        id: 3,
        type: 'credit',
        amount: 250,
        description: 'Refund - Cancelled Trip',
        method: 'Wallet',
        status: 'completed',
        date: '2024-12-10T16:45:00',
        reference: 'REF987654321',
        trip: 'Kochi → Chennai'
      },
      {
        id: 4,
        type: 'debit',
        amount: 350,
        description: 'Bus Ticket Booking',
        method: 'Wallet',
        status: 'completed',
        date: '2024-12-10T08:00:00',
        reference: 'BK20241210002',
        trip: 'Kochi → Bangalore'
      },
      {
        id: 5,
        type: 'credit',
        amount: 500,
        description: 'Wallet Top-up',
        method: 'Credit Card',
        status: 'completed',
        date: '2024-12-05T12:15:00',
        reference: 'TXN456789123'
      }
    ];

    setTimeout(() => {
      setBalance(1250);
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAddMoney = () => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      // Mock add money - in real app, integrate with payment gateway
      const newTransaction = {
        id: Date.now(),
        type: 'credit',
        amount: amount,
        description: 'Wallet Top-up',
        method: 'UPI',
        status: 'completed',
        date: new Date().toISOString(),
        reference: `TXN${Date.now()}`
      };
      
      setBalance(prev => prev + amount);
      setTransactions(prev => [newTransaction, ...prev]);
      setAddAmount('');
      setShowAddMoney(false);
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'pending') {
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
    if (status === 'failed') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return type === 'credit' 
      ? <TrendingUp className="w-5 h-5 text-green-500" />
      : <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/passenger/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-sm text-gray-500">Manage your wallet balance and transactions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-lg text-white p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
              <p className="text-teal-100 mb-4">Available for bookings and payments</p>
              <div className="text-4xl font-bold">₹{balance}</div>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <WalletIcon className="w-8 h-8" />
            </div>
          </div>
          
          <button
            onClick={() => setShowAddMoney(true)}
            className="mt-6 bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Money</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Book Trip</h3>
                <p className="text-gray-600 text-sm mb-4">Use wallet balance for bookings</p>
                <button
                  onClick={() => navigate('/passenger/booking')}
                  className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-pink-200 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Tickets</h3>
                <p className="text-gray-600 text-sm mb-4">View your booked tickets</p>
                <button
                  onClick={() => navigate('/passenger/tickets')}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View Tickets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction History</h3>
                <p className="text-gray-600 text-sm mb-4">View all your transactions</p>
                <button
                  onClick={() => document.getElementById('transactions').scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                >
                  <span>View History</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div id="transactions" className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
            <p className="text-gray-600 text-sm mt-1">All your wallet transactions</p>
          </div>
          
          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        {transaction.trip && (
                          <p className="text-sm text-gray-600">{transaction.trip}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(transaction.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(transaction.date)}
                          </span>
                          <span>{transaction.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
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

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Money to Wallet</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>
              
              <div className="flex gap-2">
                {[100, 500, 1000, 2000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setAddAmount(amount.toString())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddMoney(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                disabled={!addAmount || parseFloat(addAmount) <= 0}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;


