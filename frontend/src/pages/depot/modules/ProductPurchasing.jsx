import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { apiFetch } from '../../../utils/api';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  CreditCard,
  Truck,
  AlertCircle
} from 'lucide-react';

const ProductPurchasing = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [vendorGroups, setVendorGroups] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'cart', 'orders'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');

  useEffect(() => {
    if (user?.role === 'depot_manager') {
      fetchProducts();
      fetchCart();
      fetchPurchaseOrders();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchProducts();
        fetchCart();
        fetchPurchaseOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products?status=active&isActive=true&limit=200', {
        suppressError: true
      });
      
      if (res.ok) {
        const productsData = res.data?.data?.products || res.data?.products || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await apiFetch('/api/cart/enhanced', {
        suppressError: true
      });
      
      if (res.ok && res.data.success) {
        setCart(res.data.data.cart);
        setVendorGroups(res.data.data.vendorGroups || []);
      } else {
        setCart(null);
        setVendorGroups([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const res = await apiFetch('/api/products/purchase-orders/all', {
        suppressError: true
      });
      
      if (res.ok && res.data.success) {
        setPurchaseOrders(res.data.data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await apiFetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      });

      if (res.ok && res.data.success) {
        toast.success('Product added to cart');
        await fetchCart();
      } else {
        toast.error(res.data?.message || 'Failed to add product to cart');
      }
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdating(true);
      const res = await apiFetch(`/api/cart/update/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        await fetchCart();
        toast.success('Cart updated');
      }
    } catch (error) {
      toast.error('Failed to update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await apiFetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchCart();
        toast.success('Item removed');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || vendorGroups.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setUpdating(true);
      const createdOrders = [];
      
      for (const vendorGroup of vendorGroups) {
        const items = vendorGroup.items.map(item => {
          const productId = item.productId?._id || item.productId?.toString() || item.productId;
          return {
            productId: productId,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.finalPrice || 0
          };
        }).filter(item => item.productId);

        if (items.length === 0) continue;

        const res = await apiFetch('/api/products/create-purchase-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendorGroup.vendorId,
            items: items,
            paymentTerms: 'Net 30',
            notes: `Order created by ${user?.name || 'Depot Manager'} from depot`
          })
        });

        if (res.ok && res.data.success) {
          createdOrders.push(res.data.data.purchaseOrder);
        }
      }

      if (createdOrders.length > 0) {
        await apiFetch('/api/cart/clear', { method: 'DELETE' });
        await fetchCart();
        toast.success(`Successfully created ${createdOrders.length} purchase order(s)!`);
        setActiveTab('orders');
        await fetchPurchaseOrders();
      } else {
        toast.error('No purchase orders were created');
      }
    } catch (error) {
      console.error('Place order error:', error);
      toast.error('Failed to create purchase orders');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { label: 'Pending Approval', color: '#f59e0b', bg: '#fef3c7' },
      approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5' },
      pending: { label: 'Sent to Vendor', color: '#3b82f6', bg: '#dbeafe' },
      accepted: { label: 'Accepted', color: '#10b981', bg: '#d1fae5' },
      in_progress: { label: 'In Progress', color: '#8b5cf6', bg: '#e9d5ff' },
      delivered: { label: 'Delivered', color: '#06b6d4', bg: '#cffafe' },
      completed: { label: 'Completed', color: '#10b981', bg: '#d1fae5' },
      rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2' },
      cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9' }
    };
    
    const config = statusConfig[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        background: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.productCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesVendor = selectedVendor === 'all' || 
      (product.vendorId?._id?.toString() || product.vendorId?.toString()) === selectedVendor;
    return matchesSearch && matchesCategory && matchesVendor;
  });

  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
  const vendors = [...new Map(products
    .filter(p => p.vendorId)
    .map(p => {
      const vendorId = p.vendorId?._id?.toString() || p.vendorId?.toString();
      const vendorName = p.vendorId?.companyName || p.vendorName || 'Unknown Vendor';
      return [vendorId, { id: vendorId, name: vendorName }];
    })
  ).values()];

  const cartTotal = vendorGroups.reduce((sum, group) => sum + (group.total || 0), 0);

  return (
    <div style={{ padding: '24px' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('browse')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'browse' ? '3px solid #ec4899' : '3px solid transparent',
            color: activeTab === 'browse' ? '#ec4899' : '#64748b',
            fontWeight: activeTab === 'browse' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Package style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} size={18} />
          Browse Products
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'cart' ? '3px solid #ec4899' : '3px solid transparent',
            color: activeTab === 'cart' ? '#ec4899' : '#64748b',
            fontWeight: activeTab === 'cart' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <ShoppingCart style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} size={18} />
          Shopping Cart
          {vendorGroups.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 600
            }}>
              {vendorGroups.reduce((sum, g) => sum + g.items.length, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'orders' ? '3px solid #ec4899' : '3px solid transparent',
            color: activeTab === 'orders' ? '#ec4899' : '#64748b',
            fontWeight: activeTab === 'orders' ? 600 : 400,
            cursor: 'pointer'
          }}
        >
          <Truck style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} size={18} />
          Purchase Orders
        </button>
      </div>

      {/* Browse Products Tab */}
      {activeTab === 'browse' && (
        <div>
          {/* Search and Filters */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }} size={20} />
              <input
                type="text"
                placeholder="Search products..."
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '14px',
                minWidth: '150px'
              }}
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
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
          </div>

          {/* Products Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.map((product) => {
              const stockQty = product.stock?.quantity || 0;
              const price = product.finalPrice || product.basePrice || 0;
              const isAvailable = stockQty > 0;
              
              return (
                <div key={product._id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  background: 'white',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <Package size={40} style={{ color: '#ec4899' }} />
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                    {product.productName}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748b' }}>
                    {product.productCode}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: isAvailable ? '#10b981' : '#ef4444',
                      fontWeight: 600
                    }}>
                      Stock: {stockQty}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!isAvailable || updating}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: isAvailable ? '#ec4899' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      opacity: isAvailable ? 1 : 0.6
                    }}
                  >
                    {isAvailable ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Package size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <p style={{ color: '#64748b' }}>No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Shopping Cart Tab */}
      {activeTab === 'cart' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p>Loading cart...</p>
            </div>
          ) : vendorGroups.length > 0 ? (
            <div>
              {vendorGroups.map((vendorGroup) => (
                <div key={vendorGroup.vendorId} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px',
                  background: 'white'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
                    {vendorGroup.vendorName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vendorGroup.items.map((item, itemIndex) => {
                      const itemId = item._id || item.id || item.itemId || `item-${vendorGroup.vendorId}-${itemIndex}`;
                      return (
                        <div key={itemId} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '12px',
                          background: '#f8fafc',
                          borderRadius: '8px'
                        }}>
                          <Package size={24} style={{ color: '#ec4899' }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 600 }}>
                              {item.productName || 'Product'}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              ₹{(item.unitPrice || item.finalPrice || 0).toLocaleString('en-IN')} each
                            </p>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'white',
                            padding: '4px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <button
                              onClick={() => handleUpdateQuantity(itemId, (item.quantity || 1) - 1)}
                              disabled={updating}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Minus size={16} />
                            </button>
                            <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>
                              {item.quantity || 1}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(itemId, (item.quantity || 1) + 1)}
                              disabled={updating}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span style={{ minWidth: '100px', textAlign: 'right', fontWeight: 600 }}>
                            ₹{((item.unitPrice || item.finalPrice || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(itemId)}
                            disabled={updating}
                            style={{
                              padding: '8px',
                              border: 'none',
                              background: '#fee2e2',
                              color: '#ef4444',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Subtotal:</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#ec4899' }}>
                      ₹{vendorGroup.total?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                </div>
              ))}
              
              <div style={{
                position: 'sticky',
                bottom: 0,
                background: 'white',
                padding: '20px',
                borderTop: '2px solid #e2e8f0',
                borderRadius: '12px 12px 0 0',
                marginTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: 700 }}>Total:</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#ec4899' }}>
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={updating || vendorGroups.length === 0}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: updating || vendorGroups.length === 0 ? '#cbd5e1' : '#ec4899',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: updating || vendorGroups.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {updating ? 'Creating Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ShoppingCart size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <p style={{ color: '#64748b', fontSize: '18px', marginBottom: '8px' }}>Your cart is empty</p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>Browse products and add them to your cart</p>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Purchase Orders</h3>
            <button
              onClick={fetchPurchaseOrders}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                background: 'white',
                borderRadius: '8px',
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
          
          {purchaseOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {purchaseOrders.map((po) => (
                <div key={po._id} style={{
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
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                        {po.poNumber}
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                        Vendor: {po.vendorName || 'N/A'}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        Created: {new Date(po.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {getStatusBadge(po.status)}
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Items</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>{po.items?.length || 0}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Subtotal</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 600 }}>
                        ₹{(po.subtotal || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Total</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: '#ec4899' }}>
                        ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Truck size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <p style={{ color: '#64748b' }}>No purchase orders yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPurchasing;
