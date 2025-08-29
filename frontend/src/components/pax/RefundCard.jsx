import React from 'react';
import { RotateCcw, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const RefundCard = ({ refundData, onViewDetails }) => {
  const defaultRefunds = [
    {
      id: 1,
      amount: 450.00,
      status: 'pending',
      reason: 'Trip cancelled due to weather',
      requestedDate: '2024-12-10',
      estimatedDate: '2024-12-17'
    },
    {
      id: 2,
      amount: 1200.00,
      status: 'completed',
      reason: 'Bus breakdown',
      requestedDate: '2024-12-05',
      completedDate: '2024-12-08'
    }
  ];

  const data = refundData || defaultRefunds;
  const pendingRefunds = data.filter(refund => refund.status === 'pending');
  const completedRefunds = data.filter(refund => refund.status === 'completed');

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        text: 'Pending'
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        text: 'Completed'
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
        text: 'Rejected'
      }
    };
    return configs[status] || configs.pending;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <RotateCcw className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Refunds</h3>
          <p className="text-gray-500 text-sm mb-4">
            You haven't requested any refunds yet
          </p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Refund Status</h3>
              <p className="text-gray-500 text-sm">Track your refund requests</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ₹{pendingRefunds.reduce((sum, refund) => sum + refund.amount, 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>

        {/* Pending Refunds */}
        {pendingRefunds.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pending Refunds</h4>
            <div className="space-y-3">
              {pendingRefunds.map((refund) => {
                const statusConfig = getStatusConfig(refund.status);
                const Icon = statusConfig.icon;
                
                return (
                  <div key={refund.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-yellow-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{refund.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{refund.reason}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Requested: {refund.requestedDate}</span>
                      <span>Est. completion: {refund.estimatedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Refunds */}
        {completedRefunds.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Completed Refunds</h4>
            <div className="space-y-3">
              {completedRefunds.slice(0, 2).map((refund) => {
                const statusConfig = getStatusConfig(refund.status);
                const Icon = statusConfig.icon;
                
                return (
                  <div key={refund.id} className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-green-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.text}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{refund.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{refund.reason}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Requested: {refund.requestedDate}</span>
                      <span>Completed: {refund.completedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View All Button */}
        <button
          onClick={onViewDetails}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          View All Refunds
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RefundCard;
