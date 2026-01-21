import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  Zap,
  TrendingUp,
  Filter
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminVendorInvoicing = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [autoPaymentEnabled, setAutoPaymentEnabled] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/vendor-invoices');
      if (res.ok) {
        setInvoices(res.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (vendorId, period) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/vendor-invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ vendorId, period })
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveInvoice = async (invoiceId) => {
    try {
      const res = await apiFetch(`/api/admin/vendor-invoices/${invoiceId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error approving invoice:', error);
    }
  };

  const processPayment = async (invoiceId) => {
    try {
      const res = await apiFetch(`/api/admin/vendor-invoices/${invoiceId}/process-payment`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    return invoice.status === filterStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              Vendor Invoicing & Auto-Payment System
            </h1>
            <p className="text-gray-600 mt-2">
              Auto-generation of vendor invoices from trip logs and fuel logs with auto-payment
            </p>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={autoPaymentEnabled}
                onChange={(e) => setAutoPaymentEnabled(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">Auto-Payment</span>
            </label>
            <button
              onClick={fetchInvoices}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Payment Status */}
      {autoPaymentEnabled && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold">Auto-Payment Enabled</h2>
                <p className="text-sm text-gray-600">
                  Invoices will be automatically processed and paid based on configured rules
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter(i => i.status === 'paid').length}
              </div>
              <div className="text-sm text-gray-600">Auto-paid invoices</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.vendorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{invoice.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">₹{invoice.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(invoice.generatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => approveInvoice(invoice._id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Approve
                        </button>
                      )}
                      {invoice.status === 'approved' && (
                        <button
                          onClick={() => processPayment(invoice._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVendorInvoicing;
