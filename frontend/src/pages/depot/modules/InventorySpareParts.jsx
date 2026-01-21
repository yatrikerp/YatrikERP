import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Package, AlertCircle, QrCode, ArrowRight, ArrowLeft, Search, Filter, BarChart3, Warehouse } from 'lucide-react';
import { apiFetch } from '../../../utils/api';
import './inventory.css';

const InventorySpareParts = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [issueForm, setIssueForm] = useState({
    quantity: '',
    issuedTo: '',
    purpose: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchAlerts();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await apiFetch('/api/depot/inventory');
      if (res.ok) {
        const parts = res.data?.parts || res.data || [];
        setInventory(Array.isArray(parts) ? parts : []);
      } else {
        setInventory([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await apiFetch('/api/depot/inventory/alerts');
      if (res.ok) {
        const alertsData = res.data?.alerts || res.data || [];
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      // Handle missing endpoint gracefully
      setAlerts([]);
    }
  };

  const handleIssuePart = async (e) => {
    e.preventDefault();
    if (!selectedPart?._id || !issueForm.quantity) {
      toast.error('Please select a part and enter quantity');
      return;
    }
    
    if (parseInt(issueForm.quantity) > (selectedPart.currentStock || 0)) {
      toast.error('Insufficient stock available');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/inventory/issue', {
        method: 'POST',
        body: JSON.stringify({
          part_id: selectedPart?._id,
          ...issueForm
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Part issued successfully!');
        setShowIssueForm(false);
        setIssueForm({ quantity: '', issuedTo: '', purpose: '' });
        setSelectedPart(null);
        fetchInventory();
      } else {
        toast.error(res.message || 'Failed to issue part');
      }
    } catch (error) {
      toast.error('Error issuing part. Please try again.');
      setShowIssueForm(false);
      setIssueForm({ quantity: '', issuedTo: '', purpose: '' });
      setSelectedPart(null);
    }
  };

  const handleReturnPart = async (partId, quantity) => {
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid return quantity');
      return;
    }
    
    try {
      const res = await apiFetch('/api/depot/inventory/return', {
        method: 'POST',
        body: JSON.stringify({
          part_id: partId,
          quantity
        }),
        suppressError: true
      });
      if (res.ok) {
        toast.success('Part returned successfully!');
        fetchInventory();
      } else {
        toast.error(res.message || 'Failed to return part');
      }
    } catch (error) {
      toast.error('Error returning part. Please try again.');
    }
  };

  const getStockStatus = (current, min) => {
    if (current <= 0) return { label: 'Out of Stock', color: '#ef4444', bg: '#fee2e2', icon: '⚠️' };
    if (current <= min) return { label: 'Low Stock', color: '#f59e0b', bg: '#fef3c7', icon: '⚠️' };
    return { label: 'In Stock', color: '#10b981', bg: '#d1fae5', icon: '✓' };
  };

  const getStockPercentage = (current, min, max = 1000) => {
    if (current <= 0) return 0;
    if (current <= min) return (current / min) * 30; // Low stock shows up to 30%
    return Math.min((current / max) * 100, 100);
  };

  // Filter inventory
  const filteredInventory = inventory.filter(part => {
    const matchesSearch = !searchTerm || 
      (part.partName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.partNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || part.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'low' && (part.currentStock || 0) <= (part.minStock || 0)) ||
      (filterStatus === 'out' && (part.currentStock || 0) === 0) ||
      (filterStatus === 'in' && (part.currentStock || 0) > (part.minStock || 0));
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['all', ...new Set(inventory.map(p => p.category).filter(Boolean))];
  const totalValue = inventory.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.basePrice || 0)), 0);
  const lowStockCount = inventory.filter(p => (p.currentStock || 0) <= (p.minStock || 0)).length;
  const outOfStockCount = inventory.filter(p => (p.currentStock || 0) === 0).length;

  return (
    <div className="inventory-container">
      {/* Statistics Cards */}
      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)' }}>
            <Package size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Parts</p>
            <p className="stat-value">{inventory.length}</p>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Low Stock</p>
            <p className="stat-value">{lowStockCount}</p>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}>
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Out of Stock</p>
            <p className="stat-value">{outOfStockCount}</p>
          </div>
        </div>
        <div className="inventory-stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Value</p>
            <p className="stat-value">₹{(totalValue / 1000).toFixed(1)}K</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts - Enhanced */}
      {alerts.length > 0 && (
        <div className="inventory-alert-banner">
          <div className="alert-header">
            <AlertCircle className="alert-icon" />
            <h3>Low Stock Alerts ({alerts.length})</h3>
          </div>
          <div className="alert-items">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="alert-item">
                <div className="alert-item-content">
                  <span className="alert-part-name">{alert.partName}</span>
                  <span className="alert-stock">
                    {alert.currentStock} / {alert.minStock} min
                  </span>
                </div>
                <div className="alert-progress-bar">
                  <div 
                    className="alert-progress-fill"
                    style={{ 
                      width: `${Math.min((alert.currentStock / alert.minStock) * 100, 100)}%`,
                      background: alert.currentStock === 0 ? '#ef4444' : '#f59e0b'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="inventory-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by part name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <Filter className="filter-icon" />
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid - Card View */}
      {loading ? (
        <div className="inventory-loading">
          <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
          <p>Loading inventory...</p>
        </div>
      ) : filteredInventory.length > 0 ? (
        <div className="inventory-grid">
          {filteredInventory.map((part, index) => {
            const status = getStockStatus(part.currentStock || 0, part.minStock || 0);
            const stockPercentage = getStockPercentage(part.currentStock || 0, part.minStock || 0);
            return (
              <div key={part._id || index} className="inventory-card">
                <div className="inventory-card-header">
                  <div className="part-icon" style={{ background: status.bg }}>
                    <Package size={20} style={{ color: status.color }} />
                  </div>
                  <div className="part-info">
                    <h4 className="part-name">{part.partName || part.name || 'N/A'}</h4>
                    <div className="part-number">
                      <QrCode size={14} />
                      <span>{part.partNumber || part.number || 'N/A'}</span>
                    </div>
                  </div>
                  <span className="status-badge-inline" style={{ background: status.bg, color: status.color }}>
                    {status.icon} {status.label}
                  </span>
                </div>
                
                <div className="inventory-card-body">
                  <div className="stock-info">
                    <div className="stock-item">
                      <span className="stock-label">Current</span>
                      <span className="stock-value">{part.currentStock || 0}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Minimum</span>
                      <span className="stock-value">{part.minStock || 0}</span>
                    </div>
                    <div className="stock-item">
                      <span className="stock-label">Location</span>
                      <span className="stock-value">{part.location || 'Warehouse'}</span>
                    </div>
                  </div>
                  
                  <div className="stock-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${stockPercentage}%`,
                          background: status.color
                        }}
                      />
                    </div>
                    <span className="progress-text">{stockPercentage.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="inventory-card-actions">
                  <button
                    className="action-btn issue-btn"
                    onClick={() => {
                      setSelectedPart(part);
                      setShowIssueForm(true);
                    }}
                    disabled={!part.currentStock || part.currentStock === 0}
                  >
                    <ArrowRight size={16} />
                    Issue
                  </button>
                  <button
                    className="action-btn return-btn"
                    onClick={() => handleReturnPart(part._id, 1)}
                  >
                    <ArrowLeft size={16} />
                    Return
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="inventory-empty">
          <Warehouse size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <p>No inventory items found</p>
          {searchTerm && <p className="empty-hint">Try adjusting your search or filters</p>}
        </div>
      )}

      {/* Issue Part Modal */}
      {showIssueForm && selectedPart && (
        <div className="inventory-modal">
          <div className="inventory-modal-content">
            <h3>Issue Part: {selectedPart.partName || selectedPart.name}</h3>
            <form onSubmit={handleIssuePart}>
              <div style={{ marginBottom: '20px' }}>
                <label>Available Stock</label>
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#f8fafc', 
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1e293b'
                }}>
                  {selectedPart.currentStock || 0} units
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Quantity to Issue</label>
                <input
                  type="number"
                  min="1"
                  max={selectedPart.currentStock || 0}
                  value={issueForm.quantity}
                  onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                  required
                  placeholder="Enter quantity"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Issued To</label>
                <input
                  type="text"
                  value={issueForm.issuedTo}
                  onChange={(e) => setIssueForm({ ...issueForm, issuedTo: e.target.value })}
                  placeholder="Bus Number / Staff Name"
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Purpose</label>
                <textarea
                  value={issueForm.purpose}
                  onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                  rows="3"
                  placeholder="Maintenance / Repair / Replacement"
                  required
                />
              </div>
              <div className="inventory-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowIssueForm(false);
                    setSelectedPart(null);
                    setIssueForm({ quantity: '', issuedTo: '', purpose: '' });
                  }}
                  style={{ padding: '12px 24px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="action-btn issue-btn"
                  style={{ padding: '12px 24px' }}
                >
                  <ArrowRight size={16} />
                  Issue Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySpareParts;
