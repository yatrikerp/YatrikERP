import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  Gavel,
  Plus,
  Package,
  Clock,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  TrendingUp
} from 'lucide-react';

const ProductAuction = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [auctionForm, setAuctionForm] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    startingPrice: 0,
    reservePrice: 0,
    endDate: '',
    description: '',
    condition: 'used'
  });

  useEffect(() => {
    if (user?.role === 'depot_manager') {
      fetchAuctions();
      fetchInventory();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchAuctions();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchAuctions = async () => {
    try {
      const res = await apiFetch('/api/depot/auctions', {
        suppressError: true
      });
      
      if (res.ok) {
        const auctionsData = res.data?.data?.auctions || res.data?.auctions || [];
        setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await apiFetch('/api/depot/inventory', {
        suppressError: true
      });
      
      if (res.ok) {
        const inventoryData = res.data?.parts || res.data || [];
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleCreateAuction = async (e) => {
    e.preventDefault();
    
    if (!auctionForm.productId || !auctionForm.startingPrice || !auctionForm.endDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const res = await apiFetch('/api/depot/auctions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...auctionForm,
          depotId: user?.depotId,
          createdBy: user?._id
        })
      });

      if (res.ok && res.data.success) {
        toast.success('Auction created successfully!');
        setShowCreateModal(false);
        setAuctionForm({
          productId: '',
          productName: '',
          quantity: 1,
          startingPrice: 0,
          reservePrice: 0,
          endDate: '',
          description: '',
          condition: 'used'
        });
        await fetchAuctions();
      } else {
        toast.error(res.data?.message || 'Failed to create auction');
      }
    } catch (error) {
      console.error('Create auction error:', error);
      toast.error('Failed to create auction');
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setAuctionForm({
      productId: item._id,
      productName: item.partName || item.name || 'Product',
      quantity: 1,
      startingPrice: (item.basePrice || item.currentPrice || 0) * 0.5, // 50% of current price
      reservePrice: (item.basePrice || item.currentPrice || 0) * 0.3, // 30% reserve
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      description: `Used ${item.partName || item.name} - Good condition`,
      condition: 'used'
    });
    setShowCreateModal(true);
  };

  const getStatusBadge = (status, endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const isExpired = end < now;
    
    if (isExpired) {
      return { label: 'Expired', color: '#64748b', bg: '#f1f5f9' };
    }
    
    const statusConfig = {
      active: { label: 'Active', color: '#10b981', bg: '#d1fae5' },
      open: { label: 'Open', color: '#3b82f6', bg: '#dbeafe' },
      closed: { label: 'Closed', color: '#64748b', bg: '#f1f5f9' },
      sold: { label: 'Sold', color: '#10b981', bg: '#d1fae5' },
      cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' }
    };
    
    const config = statusConfig[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
    return config;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = !searchTerm || 
      (auction.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (auction.auctionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || auction.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeAuctions = auctions.filter(a => {
    const endDate = new Date(a.endDate || a.endTime);
    return (a.status === 'active' || a.status === 'open') && endDate > new Date();
  });

  const totalRevenue = auctions
    .filter(a => a.status === 'sold' && a.finalPrice)
    .reduce((sum, a) => sum + (a.finalPrice || 0), 0);

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
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <Gavel size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Active Auctions</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {activeAuctions.length}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <DollarSign size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Revenue</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <Package size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Auctions</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {auctions.length}
          </p>
        </div>
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <TrendingUp size={24} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Items Available</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
            {inventory.filter(i => (i.currentStock || 0) > 0).length}
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }} size={20} />
            <input
              type="text"
              placeholder="Search auctions..."
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
            <option value="active">Active</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="sold">Sold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSelectedItem(null);
            setAuctionForm({
              productId: '',
              productName: '',
              quantity: 1,
              startingPrice: 0,
              reservePrice: 0,
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              description: '',
              condition: 'used'
            });
            setShowCreateModal(true);
          }}
          style={{
            padding: '12px 24px',
            background: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} />
          Create Auction
        </button>
      </div>

      {/* Available Inventory for Auction */}
      {showCreateModal && !selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Select Item to Auction</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inventory.filter(i => (i.currentStock || 0) > 0).map(item => (
                <div
                  key={item._id}
                  onClick={() => handleSelectItem(item)}
                  style={{
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': { background: '#f8fafc' }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{item.partName || item.name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                        Stock: {item.currentStock || 0} | Price: ₹{(item.basePrice || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Package size={24} style={{ color: '#ec4899' }} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Auction Modal */}
      {showCreateModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Create New Auction</h3>
            <form onSubmit={handleCreateAuction}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Product
                </label>
                <input
                  type="text"
                  value={auctionForm.productName}
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={auctionForm.quantity}
                  onChange={(e) => setAuctionForm({ ...auctionForm, quantity: parseInt(e.target.value) || 1 })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Starting Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.startingPrice}
                  onChange={(e) => setAuctionForm({ ...auctionForm, startingPrice: parseFloat(e.target.value) || 0 })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Reserve Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={auctionForm.reservePrice}
                  onChange={(e) => setAuctionForm({ ...auctionForm, reservePrice: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={auctionForm.endDate}
                  onChange={(e) => setAuctionForm({ ...auctionForm, endDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  value={auctionForm.description}
                  onChange={(e) => setAuctionForm({ ...auctionForm, description: e.target.value })}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedItem(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#ec4899',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Create Auction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auctions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p>Loading auctions...</p>
        </div>
      ) : filteredAuctions.length > 0 ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredAuctions.map((auction) => {
            const statusBadge = getStatusBadge(auction.status, auction.endDate || auction.endTime);
            const endDate = new Date(auction.endDate || auction.endTime);
            const timeRemaining = endDate > new Date() 
              ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
              : 0;
            
            return (
              <div key={auction._id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
                      {auction.productName || 'Product'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                      {auction.description || 'No description'}
                    </p>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: statusBadge.bg,
                    color: statusBadge.color
                  }}>
                    {statusBadge.label}
                  </span>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Starting Price</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                      {formatCurrency(auction.startingPrice || 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Current Bid</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#ec4899' }}>
                      {formatCurrency(auction.currentBid || auction.startingPrice || 0)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Quantity</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                      {auction.quantity || 1}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Time Remaining</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                      {timeRemaining > 0 ? `${timeRemaining} days` : 'Expired'}
                    </p>
                  </div>
                </div>
                
                {auction.status === 'sold' && auction.finalPrice && (
                  <div style={{
                    padding: '12px',
                    background: '#d1fae5',
                    borderRadius: '8px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                      Sold for {formatCurrency(auction.finalPrice)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Gavel size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '8px' }}>No auctions found</p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Create your first auction to sell old products</p>
        </div>
      )}
    </div>
  );
};

export default ProductAuction;
