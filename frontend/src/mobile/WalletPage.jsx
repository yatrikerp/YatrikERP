import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, CreditCard, Plus, Minus, History } from 'lucide-react';

const WalletPage = () => {
  const navigate = useNavigate();
  const [balance] = useState(1250.00); // Mock balance

  // Mock transaction history
  const transactions = [
    {
      id: 'T001',
      type: 'credit',
      amount: 500,
      description: 'Added money via UPI',
      date: '2024-01-15',
      time: '10:30 AM'
    },
    {
      id: 'T002',
      type: 'debit',
      amount: 850,
      description: 'Bus booking - Kochi to Bangalore',
      date: '2024-01-14',
      time: '08:15 AM'
    },
    {
      id: 'T003',
      type: 'credit',
      amount: 200,
      description: 'Cashback from booking',
      date: '2024-01-12',
      time: '02:45 PM'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/mobile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">YATRIK Wallet</h1>
            <p className="text-sm text-gray-600">Manage your payments</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Wallet className="h-6 w-6" />
              <span className="text-lg font-medium">Available Balance</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">₹{balance.toFixed(2)}</div>
          <p className="text-blue-100 text-sm">Ready to use for bookings</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Plus className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Add Money</span>
            </div>
            <p className="text-xs text-gray-600">Top up your wallet</p>
          </button>

          <button className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Payment Methods</span>
            </div>
            <p className="text-xs text-gray-600">Manage cards & UPI</p>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <Plus className="h-4 w-4 text-green-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()} at {transaction.time}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 text-center">
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              View All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;

