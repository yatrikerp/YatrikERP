import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  RefreshCw
} from 'lucide-react';

const PaymentHistoryPanel = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Mock data for demonstration
  useEffect(() => {
    const mockPayments = [
      {
        id: 1,
        transactionId: 'TXN001234',
        bookingId: 'BK001234',
        amount: 450,
        currency: 'INR',
        status: 'Completed',
        paymentMethod: 'UPI',
        paymentDate: '2025-08-15T10:30:00',
        bookingDate: '2025-08-15T10:00:00',
        route: 'Kochi → Trivandrum',
        busNumber: 'KL-07-AB-1234',
        seatNo: 'A12',
        refundStatus: null,
        refundAmount: null,
        refundDate: null,
        gateway: 'Razorpay',
        cardLast4: null,
        upiId: 'user@okicici'
      },
      {
        id: 2,
        transactionId: 'TXN001235',
        bookingId: 'BK001235',
        amount: 1200,
        currency: 'INR',
        status: 'Completed',
        paymentMethod: 'Credit Card',
        paymentDate: '2025-08-16T14:15:00',
        bookingDate: '2025-08-16T14:00:00',
        route: 'Kochi → Bangalore',
        busNumber: 'KL-07-CD-5678',
        seatNo: 'B15',
        refundStatus: null,
        refundAmount: null,
        refundDate: null,
        gateway: 'Stripe',
        cardLast4: '4242',
        upiId: null
      },
      {
        id: 3,
        transactionId: 'TXN001230',
        bookingId: 'BK001230',
        amount: 800,
        currency: 'INR',
        status: 'Completed',
        paymentMethod: 'Net Banking',
        paymentDate: '2025-08-10T09:45:00',
        bookingDate: '2025-08-10T09:00:00',
        route: 'Kochi → Chennai',
        busNumber: 'KL-07-EF-9012',
        seatNo: 'C08',
        refundStatus: null,
        refundAmount: null,
        refundDate: null,
        gateway: 'Razorpay',
        cardLast4: null,
        upiId: null
      },
      {
        id: 4,
        transactionId: 'TXN001231',
        bookingId: 'BK001231',
        amount: 1200,
        currency: 'INR',
        status: 'Refunded',
        paymentMethod: 'Credit Card',
        paymentDate: '2025-08-12T11:20:00',
        bookingDate: '2025-08-12T11:00:00',
        route: 'Bangalore → Kochi',
        busNumber: 'KA-01-GH-3456',
        seatNo: 'A15',
        refundStatus: 'Processed',
        refundAmount: 1200,
        refundDate: '2025-08-13T15:30:00',
        gateway: 'Stripe',
        cardLast4: '4242',
        upiId: null
      },
      {
        id: 5,
        transactionId: 'TXN001236',
        bookingId: 'BK001236',
        amount: 600,
        currency: 'INR',
        status: 'Failed',
        paymentMethod: 'UPI',
        paymentDate: '2025-08-17T16:00:00',
        bookingDate: '2025-08-17T15:45:00',
        route: 'Kochi → Munnar',
        busNumber: 'KL-07-IJ-7890',
        seatNo: 'D20',
        refundStatus: null,
        refundAmount: null,
        refundDate: null,
        gateway: 'Razorpay',
        cardLast4: null,
        upiId: 'user@okicici'
      }
    ];
    
    setPayments(mockPayments);
    setFilteredPayments(mockPayments);
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = payments;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.route.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'Pending': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'Refunded': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Processing': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Failed': return <XCircle className="w-4 h-4" />;
      case 'Refunded': return <RefreshCw className="w-4 h-4" />;
      case 'Processing': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'Credit Card':
      case 'Debit Card':
        return <CreditCard className="w-4 h-4" />;
      case 'UPI':
        return <Receipt className="w-4 h-4" />;
      case 'Net Banking':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const handleDownloadReceipt = (paymentId) => {
    // TODO: Implement receipt download logic
    console.log('Downloading receipt for payment:', paymentId);
  };

  const handleDownloadInvoice = (paymentId) => {
    // TODO: Implement invoice download logic
    console.log('Downloading invoice for payment:', paymentId);
  };

  const tabs = [
    { id: 'all', label: 'All Payments', count: payments.length },
    { id: 'Completed', label: 'Completed', count: payments.filter(p => p.status === 'Completed').length },
    { id: 'Pending', label: 'Pending', count: payments.filter(p => p.status === 'Pending').length },
    { id: 'Failed', label: 'Failed', count: payments.filter(p => p.status === 'Failed').length },
    { id: 'Refunded', label: 'Refunded', count: payments.filter(p => p.status === 'Refunded').length }
  ];

  const getFilteredPaymentsByTab = () => {
    if (activeTab === 'all') {
      return filteredPayments;
    }
    return filteredPayments.filter(payment => payment.status === activeTab);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-gray-600 mt-1">Track all your payment transactions</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center justify-end text-sm text-gray-600">
              {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{tab.label}</span>
                <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {getFilteredPaymentsByTab().length > 0 ? (
            <div className="space-y-4">
              {getFilteredPaymentsByTab().map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Payment Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{payment.route}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </div>
                        </span>
                        {payment.refundStatus && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {payment.refundStatus}
                          </span>
                        )}
                      </div>

                      {/* Payment Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="font-medium text-gray-900">{payment.paymentMethod}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Payment Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Transaction ID</p>
                            <p className="font-medium text-gray-900">{payment.transactionId}</p>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Booking ID:</span>
                          <span className="ml-2 font-medium text-gray-900">{payment.bookingId}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Gateway:</span>
                          <span className="ml-2 font-medium text-gray-900">{payment.gateway}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bus Number:</span>
                          <span className="ml-2 font-medium text-gray-900">{payment.busNumber}</span>
                        </div>
                      </div>

                      {/* Payment Method Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {payment.cardLast4 && (
                          <div>
                            <span className="text-gray-500">Card:</span>
                            <span className="ml-2 font-medium text-gray-900">•••• {payment.cardLast4}</span>
                          </div>
                        )}
                        {payment.upiId && (
                          <div>
                            <span className="text-gray-500">UPI ID:</span>
                            <span className="ml-2 font-medium text-gray-900">{payment.upiId}</span>
                          </div>
                        )}
                      </div>

                      {/* Refund Information */}
                      {payment.refundStatus && payment.refundAmount && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Refund Amount:</span>
                              <span className="ml-2 font-medium text-gray-900">{formatCurrency(payment.refundAmount, payment.currency)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Refund Date:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {new Date(payment.refundDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className="ml-2 font-medium text-gray-900">{payment.refundStatus}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadReceipt(payment.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Receipt"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadInvoice(payment.id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <Receipt className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No {activeTab === 'all' ? '' : activeTab.toLowerCase()} payments found</p>
              <p className="text-sm text-gray-400">
                {activeTab === 'all' ? 'Your payment history will appear here' :
                 `No ${activeTab.toLowerCase()} payments in your history`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{selectedPayment.route}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">{selectedPayment.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-medium text-gray-900">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium text-gray-900">{selectedPayment.bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedPayment.paymentDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gateway</p>
                  <p className="font-medium text-gray-900">{selectedPayment.gateway}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bus Number</p>
                  <p className="font-medium text-gray-900">{selectedPayment.busNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seat Number</p>
                  <p className="font-medium text-gray-900">{selectedPayment.seatNo}</p>
                </div>
              </div>
              
              {selectedPayment.refundStatus && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Refund Status</p>
                      <p className="font-medium text-gray-900">{selectedPayment.refundStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Refund Amount</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(selectedPayment.refundAmount, selectedPayment.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Refund Date</p>
                      <p className="font-medium text-gray-900">
                        {selectedPayment.refundDate ? new Date(selectedPayment.refundDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadReceipt(selectedPayment.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Receipt
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedPayment.id)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPanel;
