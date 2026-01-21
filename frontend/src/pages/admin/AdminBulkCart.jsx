import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Star,
  Package,
  Gavel,
  CreditCard,
  TrendingDown,
  ArrowLeft,
  CheckCircle,
  X,
  FileText,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminBulkCart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [vendorGroups, setVendorGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [poLoading, setPoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cart'); // 'cart', 'orders', or 'browse'
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await apiFetch('/api/products?status=active&isActive=true&limit=200', {
        suppressError: true
      });

      if (res.ok) {
        const list = res.data?.data?.products || res.data?.products || [];
        setProducts(Array.isArray(list) ? list : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      setUpdating(true);
      const res = await apiFetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity
        })
      });

      if (res.ok && res.data.success) {
        toast.success('Added to cart');
        await fetchCart();
      } else {
        toast.error(res.data?.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'depot_manager') {
      fetchCart();
      fetchPurchaseOrders();
      
      // Auto-refresh every 30 seconds for live updates
      const interval = setInterval(() => {
        fetchCart();
        fetchPurchaseOrders();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'browse' && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/cart/enhanced', {
        suppressError: true // Suppress 404 errors for admin pages
      });
      
      if (res.ok && res.data.success) {
        setCart(res.data.data.cart);
        setVendorGroups(res.data.data.vendorGroups || []);
        setCartTotal(res.data.data.summary?.total || 0);
      } else if (!res.ok) {
        // Cart is empty or doesn't exist
        setCart(null);
        setVendorGroups([]);
        setCartTotal(0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
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
      
      // Create purchase orders for each vendor group
      for (const vendorGroup of vendorGroups) {
        const items = vendorGroup.items.map(item => {
          // Extract productId - could be object or string
          const productId = item.productId?._id || item.productId?._id?.toString() || item.productId?.toString() || item.productId;
          
          return {
            productId: productId,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || item.unitPrice || 0
          };
        }).filter(item => item.productId); // Filter out items without productId

        if (items.length === 0) {
          console.warn(`No valid items for vendor ${vendorGroup.vendorId}`);
          continue;
        }

        const res = await apiFetch('/api/products/create-purchase-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendorGroup.vendorId,
            items: items,
            paymentTerms: 'Net 30',
            notes: 'Order created from bulk cart'
          })
        });

        if (!res.ok || !res.data.success) {
          throw new Error(res.data?.message || `Failed to create purchase order for ${vendorGroup.vendorName}`);
        }

        createdOrders.push(res.data.data.purchaseOrder);
      }

      if (createdOrders.length === 0) {
        toast.error('No purchase orders were created. Please check your cart items.');
        return;
      }

      // Clear cart after successful order creation
      try {
        await apiFetch('/api/cart/clear', { method: 'DELETE' });
      } catch (clearError) {
        console.warn('Failed to clear cart:', clearError);
      }
      
      await fetchCart();
      toast.success(`Successfully created ${createdOrders.length} purchase order(s)!`);
      setActiveTab('orders');
      await fetchPurchaseOrders();
    } catch (error) {
      console.error('Place order error:', error);
      toast.error(error.message || 'Failed to create purchase orders');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToAuction = async () => {
    if (!cart || vendorGroups.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setUpdating(true);
      
      // Create auction items from cart
      const auctionItems = [];
      for (const vendorGroup of vendorGroups) {
        for (const item of vendorGroup.items) {
          const productId = item.productId?._id || item.productId?.toString() || item.productId;
          auctionItems.push({
            productId: productId,
            productName: item.productName,
            productCode: item.productCode,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            vendorId: vendorGroup.vendorId,
            vendorName: vendorGroup.vendorName
          });
        }
      }

      // Try to create auction via API, or show info if endpoint doesn't exist
      try {
        const res = await apiFetch('/api/auctions/create-from-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: auctionItems,
            notes: 'Auction created from bulk cart'
          })
        });

        if (res.ok && res.data.success) {
          // Clear cart after successful auction creation
          await apiFetch('/api/cart/clear', { method: 'DELETE' });
          await fetchCart();
          toast.success('Auction created successfully!');
        } else {
          throw new Error(res.data?.message || 'Failed to create auction');
        }
      } catch (apiError) {
        // If auction endpoint doesn't exist, create purchase orders instead and mark for auction
        toast.info('Auction feature in development. Creating purchase orders with auction flag...');
        
        // Create purchase orders with auction flag
        for (const vendorGroup of vendorGroups) {
          const items = vendorGroup.items.map(item => {
            const productId = item.productId?._id || item.productId?.toString() || item.productId;
            return {
              productId: productId,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0
            };
          }).filter(item => item.productId);

          if (items.length > 0) {
            await apiFetch('/api/products/create-purchase-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vendorId: vendorGroup.vendorId,
                items: items,
                paymentTerms: 'Auction',
                notes: 'Order created from bulk cart - Converted to Auction'
              })
            });
          }
        }

        await apiFetch('/api/cart/clear', { method: 'DELETE' });
        await fetchCart();
        toast.success('Items converted to auction format!');
      }
    } catch (error) {
      console.error('Convert to auction error:', error);
      toast.error(error.message || 'Failed to convert to auction');
    } finally {
      setUpdating(false);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setPoLoading(true);
      // Fetch all purchase orders for admin/depot
      const res = await apiFetch('/api/products/purchase-orders/all', {
        suppressError: true
      });
      
      if (res.ok && res.data.success) {
        setPurchaseOrders(res.data.data.purchaseOrders || []);
      } else {
        // Fallback to pending approval endpoint
        const pendingRes = await apiFetch('/api/products/purchase-orders/pending-approval', {
          suppressError: true
        });
        
        if (pendingRes.ok && pendingRes.data.success) {
          setPurchaseOrders(pendingRes.data.data.purchaseOrders || []);
        } else {
          setPurchaseOrders([]);
        }
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setPurchaseOrders([]);
    } finally {
      setPoLoading(false);
    }
  };

  const handleApprovePO = async (poId) => {
    try {
      const res = await apiFetch(`/api/products/purchase-orders/${poId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments: 'Approved by admin' }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok && res.data.success) {
        toast.success('Purchase order approved');
        await fetchPurchaseOrders();
      } else {
        toast.error('Failed to approve purchase order');
      }
    } catch (error) {
      toast.error('Failed to approve purchase order');
    }
  };

  const handleSendToVendor = async (poId) => {
    try {
      const res = await apiFetch(`/api/products/purchase-orders/${poId}/send-to-vendor`, {
        method: 'POST'
      });
      
      if (res.ok && res.data.success) {
        toast.success('Purchase order sent to vendor');
        await fetchPurchaseOrders();
      } else {
        toast.error('Failed to send purchase order');
      }
    } catch (error) {
      toast.error('Failed to send purchase order');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Approval' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, label: 'Approved' },
      pending: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Sent to Vendor' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      in_progress: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'In Progress' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Delivered' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
    };
    
    const statusConfig = config[status] || config.pending_approval;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </span>
    );
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? 'text-yellow-400 fill-current'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Cart</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin' ? 'Admin Cart' : 'Depot Cart'} - Manage your bulk purchases
          </p>
        </div>
            <button
              onClick={() => {
                fetchCart();
                fetchPurchaseOrders();
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab('browse');
                  if (products.length === 0) fetchProducts();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'browse'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Browse Products
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShoppingCart className="w-5 h-5 inline mr-2" />
                Shopping Cart
                {vendorGroups.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {vendorGroups.reduce((sum, vg) => sum + vg.items.length, 0)}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  fetchPurchaseOrders();
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 inline mr-2" />
                Purchase Orders
                {purchaseOrders.filter(po => po.status === 'pending_approval' || po.adminApprovalStatus === 'pending').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {purchaseOrders.filter(po => po.status === 'pending_approval' || po.adminApprovalStatus === 'pending').length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'browse' ? (
          <div className="mt-8">
            {/* Search and Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products by name, code, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="ENGINE">Engine</option>
                  <option value="BRAKES">Brakes</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="SUSPENSION">Suspension</option>
                  <option value="TYRES">Tyres</option>
                  <option value="HVAC">HVAC</option>
                </select>
                <button
                  onClick={fetchProducts}
                  disabled={productsLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products
                  .filter(product => {
                    const matchesSearch = !searchTerm || 
                      product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
                    return matchesSearch && matchesCategory && product.status === 'active' && product.isActive;
                  })
                  .map((product) => (
                    <div
                      key={product._id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      {/* Product Image */}
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url ? (
                          <img
                            src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-16 h-16 text-gray-400" />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.productName}</h3>
                          <p className="text-sm text-gray-600">Code: {product.productCode}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {product.category}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Price:</span>
                            <span className="font-bold text-lg text-gray-900">
                              ₹{product.finalPrice?.toLocaleString() || product.basePrice?.toLocaleString() || '0'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Stock:</span>
                            <span className={`font-medium ${
                              (product.stock?.quantity || 0) > 10 ? 'text-green-600' : 
                              (product.stock?.quantity || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {product.stock?.quantity || 0} {product.stock?.unit || 'pieces'}
                            </span>
                          </div>
                          {product.moq && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">MOQ:</span>
                              <span className="text-sm font-medium text-gray-700">{product.moq} units</span>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => handleAddToCart(product._id, product.moq || 1)}
                          disabled={updating || !product.stock?.quantity || product.stock.quantity < (product.moq || 1)}
                          className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {!productsLoading && products.filter(p => {
              const matchesSearch = !searchTerm || 
                p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category?.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
              return matchesSearch && matchesCategory && p.status === 'active' && p.isActive;
            }).length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
              <div className="text-sm text-gray-600">
                Auto-refreshes every 30 seconds
              </div>
            </div>
            
            {poLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders</h3>
                <p className="text-gray-600">Purchase orders will appear here once created</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchaseOrders.map((po) => (
                      <tr key={po._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {po.poNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {po.vendorName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {po.items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(po.totalAmount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(po.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 
                           po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {po.status === 'pending_approval' && (
                              <>
                                <button
                                  onClick={() => handleApprovePO(po._id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      apiFetch(`/api/products/purchase-orders/${po._id}/reject`, {
                                        method: 'POST',
                                        body: JSON.stringify({ reason }),
                                        headers: { 'Content-Type': 'application/json' }
                                      }).then(() => {
                                        toast.success('Purchase order rejected');
                                        fetchPurchaseOrders();
                                      });
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {po.status === 'approved' && (
                              <button
                                onClick={() => handleSendToVendor(po._id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Send to Vendor"
                              >
                                <Package className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                // View PO details
                                navigate(`/admin/purchase-orders/${po._id}`);
                              }}
                              className="text-gray-600 hover:text-gray-800"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : vendorGroups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add products from the marketplace to get started</p>
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Package className="w-5 h-5" />
              <span>Browse Products</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items - Left Side (2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              {vendorGroups.map((vendorGroup) => (
                <div key={vendorGroup.vendorId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Vendor Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{vendorGroup.vendorName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {renderStars(vendorGroup.vendorRating || 4)}
                          <span className="text-blue-200 text-sm">
                            ({vendorGroup.vendorRating || 4.0})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">Total</div>
                        <div className="text-white text-xl font-bold">
                          {formatCurrency(vendorGroup.total)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-6 space-y-4">
                    {vendorGroup.items.map((item, itemIndex) => {
                      const itemId = item._id || item.id || item.itemId || `item-${vendorGroup.vendorId}-${itemIndex}`;
                      return (
                      <div
                        key={itemId}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-12 h-12 text-gray-400" />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.productName}
                            </h4>
                            <div className="flex items-center space-x-4 mb-3 flex-wrap gap-2">
                              <span className="text-sm text-gray-600">Code: {item.productCode}</span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                MOQ: {item.moq || 50} Units
                              </span>
                              {item.schemeInfo && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                                  <TrendingDown className="w-3 h-3" />
                                  <span>{item.schemeInfo.message || 'Scheme Applied'}</span>
                                </span>
                              )}
                            </div>

                            {/* Quantity and Price */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-600">Quantity:</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      const currentQty = item.quantity || 1;
                                      const newQty = Math.max(1, currentQty - 1);
                                      
                                      if (itemId && itemId !== `item-${vendorGroup.vendorId}-${itemIndex}`) {
                                        await handleUpdateQuantity(itemId, newQty);
                                      } else {
                                        console.error('Item ID not found:', item);
                                        toast.error('Cannot update: Item ID missing');
                                      }
                                    }}
                                    disabled={updating || !itemId || itemId === `item-${vendorGroup.vendorId}-${itemIndex}` || (item.quantity || 1) <= 1}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="text-lg font-semibold text-gray-900 w-12 text-center min-w-[3rem]">
                                    {updating ? '...' : (item.quantity || 1)}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      const currentQty = item.quantity || 1;
                                      const newQty = currentQty + 1;
                                      
                                      if (itemId && itemId !== `item-${vendorGroup.vendorId}-${itemIndex}`) {
                                        await handleUpdateQuantity(itemId, newQty);
                                      } else {
                                        console.error('Item ID not found:', item);
                                        toast.error('Cannot update: Item ID missing');
                                      }
                                    }}
                                    disabled={updating || !itemId || itemId === `item-${vendorGroup.vendorId}-${itemIndex}`}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatCurrency(item.total || item.subtotal || 0)}
                                </div>
                                {item.schemeDiscount > 0 && (
                                  <div className="text-sm text-green-600">
                                    Save {formatCurrency(item.schemeDiscount)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => {
                                if (itemId && itemId !== `item-${vendorGroup.vendorId}-${itemIndex}`) {
                                  handleRemoveItem(itemId);
                                } else {
                                  console.error('Item ID not found for removal:', item);
                                  toast.error('Cannot remove: Item ID missing');
                                }
                              }}
                              disabled={!itemId || itemId === `item-${vendorGroup.vendorId}-${itemIndex}`}
                              className="mt-4 w-full py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove Item</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary - Right Side (1 column) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart?.summary?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST)</span>
                    <span>{formatCurrency(cart?.summary?.taxAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart?.summary?.discount || 0)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={updating || vendorGroups.length === 0 || cartTotal === 0}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Creating Orders...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleConvertToAuction}
                    disabled={updating || vendorGroups.length === 0 || cartTotal === 0}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Gavel className="w-5 h-5" />
                    <span>Convert to Auction</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBulkCart;
