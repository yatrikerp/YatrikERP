import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';

const PaymentTracking = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    pendingPayment: 0,
    overdueAmount: 0,
    paymentRate: 0
  });

  useEffect(() => {
    if (user?.role === 'depot_manager') {
      fetchPayments();
      fetchInvoices();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPayments();
        fetchInvoices();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const res = await apiFetch('/api/depot/payments', {
        suppressError: true
      });
      
      if (res.ok) {
        const paymentsData = res.data?.data?.payments || res.data?.payments || [];
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        calculateStats(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await apiFetch('/api/depot/invoices', {
        suppressError: true
      });
      
      if (res.ok) {
        const invoicesData = res.data?.data?.invoices || res.data?.invoices || [];
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const calculateStats = (paymentsData) => {
    const totalInvoiced = paymentsData.reduce((sum, p) => 
      sum + (p.totalAmount || p.amount || 0), 0);
    const totalPaid = paymentsData
      .filter(p => p.status === 'paid' || p.invoiceStatus === 'paid')
      .reduce((sum, p) => sum + (p.amount || p.paidAmount || 0), 0);
    const pendingPayment = paymentsData
      .filter(p => p.status === 'pending' || p.dueAmount > 0)
      .reduce((sum, p) => sum + (p.dueAmount || p.totalAmount - (p.paidAmount || 0) || 0), 0);
    
    const now = new Date();
    const overdueAmount = paymentsData
      .filter(p => {
        const dueDate = new Date(p.dueDate || p.paymentDueDate);
        return dueDate < now && (p.status !== 'paid' && p.invoiceStatus !== 'paid');
      })
      .reduce((sum, p) => sum + (p.dueAmount || p.totalAmount - (p.paidAmount || 0) || 0), 0);
    
    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;
    
    setStats({
      totalInvoiced,
      totalPaid,
      pendingPayment,
      overdueAmount,
      paymentRate
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadge = (payment) => {
    const status = payment.status || payment.invoiceStatus || 'pending';
    const isPaid = status === 'paid';
    const dueDate = payment.dueDate || payment.paymentDueDate;
    const daysOverdue = getDaysOverdue(dueDate);
    const isOverdue = !isPaid && daysOverdue > 0;
    
    if (isPaid) {
      return { label: 'Paid', color: '#10b981', bg: '#d1fae5', icon: CheckCircle };
    } else if (isOverdue) {
      return { label: `${daysOverdue} days overdue`, color: '#ef4444', bg: '#fee2e2', icon: AlertCircle };
    } else {
      return { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', icon: Clock };
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      (payment.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const status = payment.status || payment.invoiceStatus || 'pending';
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'paid' && status === 'paid') ||
      (filterStatus === 'pending' && status === 'pending') ||
      (filterStatus === 'overdue' && getDaysOverdue(payment.dueDate || payment.paymentDueDate) > 0);
    
    const vendorId = payment.vendorId?._id?.toString() || payment.vendorId?.toString();
    const matchesVendor = filterStatus === 'all' || vendorId === filterVendor;
    
    return matchesSearch && matchesStatus && matchesVendor;
  });

  const vendors = [...new Map(payments
    .filter(p => p.vendorId)
    .map(p => {
      const vendorId = p.vendorId?._id?.toString() || p.vendorId?.toString();
      const vendorName = p.vendorId?.companyName || p.vendorName || 'Unknown Vendor';
      return [vendorId, { id: vendorId, name: vendorName }];
    })
  ).values()];

  return (
    <div style={{ padding: '24px' }}>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <DollarSign size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Invoiced</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {formatCurrency(stats.totalInvoiced)}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <CheckCircle size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Paid</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <Clock size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Pending Payment</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {formatCurrency(stats.pendingPayment)}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <AlertCircle size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Overdue</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {formatCurrency(stats.overdueAmount)}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <TrendingUp size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Payment Rate</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {stats.paymentRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8'
          }} size={20} />
          <input
            type="text"
            placeholder="Search by vendor, invoice, or PO number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Vendors</option>
          {vendors.map(vendor => (
            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
          ))}
        </select>
        <button
          onClick={fetchPayments}
          style={{
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            background: 'white',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p>Loading payments...</p>
        </div>
      ) : filteredPayments.length > 0 ? (
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'white'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Invoice #</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Vendor</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>PO Number</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>Amount</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>Paid</th>
                  <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>Due</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Due Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const statusBadge = getStatusBadge(payment);
                  const totalAmount = payment.totalAmount || payment.amount || 0;
                  const paidAmount = payment.paidAmount || (payment.status === 'paid' ? totalAmount : 0);
                  const dueAmount = totalAmount - paidAmount;
                  const daysOverdue = getDaysOverdue(payment.dueDate || payment.paymentDueDate);
                  
                  return (
                    <tr key={payment._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {payment.invoiceNumber || payment.invoiceId || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {payment.vendorName || payment.vendorId?.companyName || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        {payment.poNumber || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 600 }}>
                        {formatCurrency(totalAmount)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#10b981' }}>
                        {formatCurrency(paidAmount)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: dueAmount > 0 ? '#ef4444' : '#10b981' }}>
                        {formatCurrency(dueAmount)}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>
                        <div>
                          {formatDate(payment.dueDate || payment.paymentDueDate)}
                          {daysOverdue > 0 && (
                            <span style={{ 
                              display: 'block', 
                              fontSize: '12px', 
                              color: '#ef4444',
                              marginTop: '4px'
                            }}>
                              {daysOverdue} days overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <statusBadge.icon size={14} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #e2e8f0',
                              background: 'white',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {payment.invoiceUrl && (
                            <button
                              style={{
                                padding: '6px 12px',
                                border: '1px solid #e2e8f0',
                                background: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Download Invoice"
                            >
                              <Download size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CreditCard size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '8px' }}>No payments found</p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Payment records will appear here</p>
        </div>
      )}
    </div>
  );
};

export default PaymentTracking;
