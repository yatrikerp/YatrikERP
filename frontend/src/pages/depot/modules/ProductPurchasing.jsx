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
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';

const ProductPurchasing = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [vendorGroups, setVendorGroups] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'cart', 'orders', 'deliveries'
  const [deliveries, setDeliveries] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('net_30'); // 'net_30', 'net_45', 'net_60', 'cash', 'advance'

  useEffect(() => {
    if (user?.role === 'depot_manager') {
      fetchProducts();
      fetchCart();
      fetchPurchaseOrders();
      fetchDeliveries();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchProducts();
        fetchCart();
        fetchPurchaseOrders();
        fetchDeliveries();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await apiFetch('/api/products?status=active&isActive=true&limit=200', {
        suppressError: true
      });
      
      if (res.ok) {
        const productsData = res.data?.data?.products || res.data?.products || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('Failed to fetch products:', res.data?.message || res.message);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await apiFetch('/api/cart/enhanced', {
        suppressError: true
      });
      
      if (res.ok && res.data?.success) {
        setCart(res.data.data?.cart || null);
        setVendorGroups(res.data.data?.vendorGroups || []);
      } else {
        setCart(null);
        setVendorGroups([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
      setVendorGroups([]);
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

  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const res = await apiFetch('/api/depot/deliveries', {
        suppressError: true
      });
      
      if (res.ok && res.data?.success) {
        setDeliveries(res.data.data?.deliveries || []);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleConfirmDelivery = async (poId) => {
    // Optimistic update - show instantly
    setDeliveries(prevDeliveries =>
      prevDeliveries.map(delivery =>
        delivery._id === poId
          ? {
              ...delivery,
              status: 'delivered',
              deliveryStatus: {
                ...delivery.deliveryStatus,
                status: 'delivered'
              },
              actualDeliveryDate: new Date(),
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : delivery
      )
    );

    try {
      const res = await apiFetch(`/api/depot/purchase-orders/${poId}/confirm-delivery`, {
        method: 'PUT',
        body: JSON.stringify({ notes: 'Delivery confirmed by depot' }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok && res.data?.success) {
        toast.success('Delivery confirmed successfully');
        // Update with server response
        fetchDeliveries();
        fetchPurchaseOrders();
      } else {
        // Revert optimistic update on error
        fetchDeliveries();
        toast.error(res.data?.message || 'Failed to confirm delivery');
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      // Revert optimistic update on error
      fetchDeliveries();
      toast.error('Failed to confirm delivery');
    }
  };

  const handleMarkPaymentReceived = async (po) => {
    // Check if there's an invoice for this PO
    if (!po.invoiceId) {
      toast.error('No invoice found for this purchase order. Please create an invoice first.');
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Mark payment as received for ${po.poNumber}?\n\nAmount: ₹${(po.totalAmount || 0).toLocaleString('en-IN')}\n\nThis will allow delivery to start.`
    );

    if (!confirmed) return;

    // Optimistic update - show instantly
    setDeliveries(prevDeliveries =>
      prevDeliveries.map(delivery =>
        delivery._id === po._id
          ? {
              ...delivery,
              paymentStatus: 'paid',
              status: 'in_progress',
              deliveryStatus: {
                ...delivery.deliveryStatus,
                status: 'in_transit'
              },
              _isUpdating: true,
              _lastUpdated: Date.now()
            }
          : delivery
      )
    );

    try {
      const res = await apiFetch(`/api/depot/invoices/${po.invoiceId}/mark-payment-received`, {
        method: 'PUT',
        body: JSON.stringify({
          paymentMethod: 'bank_transfer',
          notes: `Payment marked from Deliveries tab for PO ${po.poNumber}`
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok && res.data?.success) {
        toast.success('Payment marked as received! Delivery can now start.');
        // Update with server response
        fetchDeliveries();
        fetchPurchaseOrders();
      } else {
        // Revert optimistic update on error
        fetchDeliveries();
        toast.error(res.data?.message || 'Failed to mark payment as received');
      }
    } catch (error) {
      console.error('Error marking payment:', error);
      // Revert optimistic update on error
      fetchDeliveries();
      toast.error('Failed to mark payment as received');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      // Check if product is available
      const availableStock = product.stock?.quantity || 0;
      if (availableStock < 1) {
        toast.error('Product is out of stock');
        return;
      }

      // Optimistic update - show instantly
      // Update product stock immediately
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === product._id
            ? {
                ...p,
                stock: {
                  ...p.stock,
                  quantity: Math.max(0, (p.stock?.quantity || 0) - 1)
                },
                _isUpdating: true,
                _lastUpdated: Date.now()
              }
            : p
        )
      );

      const res = await apiFetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1
        })
      });

      if (res.ok) {
        const success = res.data?.success || (res.data?.data && res.data.data.success);
        if (success) {
          toast.success('Product added to cart');
          
          // Update with server response
          await Promise.all([
            fetchCart(),
            fetchProducts()
          ]);
          
          // Switch to cart tab to show the newly added item immediately
          setActiveTab('cart');
        } else {
          // Revert optimistic update on error
          await Promise.all([fetchCart(), fetchProducts()]);
          toast.error(res.data?.message || res.data?.data?.message || 'Failed to add product to cart');
        }
      } else {
        // Revert optimistic update on error
        await Promise.all([fetchCart(), fetchProducts()]);
        toast.error(res.data?.message || res.message || 'Failed to add product to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      // Revert optimistic update on error
      await Promise.all([fetchCart(), fetchProducts()]);
      toast.error('Failed to add product to cart');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    // Optimistic update - show instantly
    if (cart && vendorGroups) {
      const updatedVendorGroups = vendorGroups.map(group => ({
        ...group,
        items: group.items.map(item => {
          if (item._id === itemId || item.id === itemId) {
            return { ...item, quantity: newQuantity, _isUpdating: true, _lastUpdated: Date.now() };
          }
          return item;
        })
      }));
      setVendorGroups(updatedVendorGroups);
    }

    try {
      setUpdating(true);
      const res = await apiFetch(`/api/cart/update/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQuantity }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const success = res.data?.success || (res.data?.data && res.data.data.success);
        if (success) {
          toast.success('Cart updated');
          // Update with server response
          await Promise.all([fetchCart(), fetchProducts()]);
        } else {
          // Revert optimistic update on error
          await Promise.all([fetchCart(), fetchProducts()]);
          toast.error(res.data?.message || res.data?.data?.message || 'Failed to update cart');
        }
      } else {
        // Revert optimistic update on error
        await Promise.all([fetchCart(), fetchProducts()]);
        toast.error(res.data?.message || res.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      // Revert optimistic update on error
      await Promise.all([fetchCart(), fetchProducts()]);
      toast.error(error.message || 'Failed to update cart');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    // Optimistic update - show instantly
    if (cart && vendorGroups) {
      const updatedVendorGroups = vendorGroups.map(group => ({
        ...group,
        items: group.items.filter(item => (item._id !== itemId && item.id !== itemId))
      })).filter(group => group.items.length > 0);
      setVendorGroups(updatedVendorGroups);
    }

    try {
      const res = await apiFetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const success = res.data?.success || (res.data?.data && res.data.data.success);
        if (success) {
          toast.success('Item removed from cart');
          // Update with server response
          await Promise.all([fetchCart(), fetchProducts()]);
        } else {
          // Revert optimistic update on error
          await Promise.all([fetchCart(), fetchProducts()]);
          toast.error(res.data?.message || res.data?.data?.message || 'Failed to remove item');
        }
      } else {
        // Revert optimistic update on error
        await Promise.all([fetchCart(), fetchProducts()]);
        toast.error(res.data?.message || res.message || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Remove item error:', error);
      // Revert optimistic update on error
      await Promise.all([fetchCart(), fetchProducts()]);
      toast.error(error.message || 'Failed to remove item');
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
      const errors = [];
      
      for (const vendorGroup of vendorGroups) {
        console.log('Processing vendor group:', vendorGroup.vendorName, 'Items:', vendorGroup.items);
        
        const items = vendorGroup.items.map((item, index) => {
          // Handle multiple ways productId might be stored
          let productId = null;
          
          // Try different ways to extract productId
          if (item.productId) {
            if (typeof item.productId === 'object' && item.productId._id) {
              // Populated productId object (from MongoDB populate)
              productId = item.productId._id.toString();
            } else if (typeof item.productId === 'object') {
              // ObjectId object
              productId = item.productId.toString();
            } else {
              // Direct ObjectId string
              productId = String(item.productId);
            }
          }
          
          // Fallback: try to get from product reference if productId is missing
          if (!productId && item.product) {
            productId = item.product._id?.toString() || item.product.toString();
          }
          
          // If still no productId, log and skip this item
          if (!productId) {
            console.error(`Item ${index} missing productId:`, {
              item,
              productId: item.productId,
              product: item.product,
              keys: Object.keys(item)
            });
            return null;
          }
          
          const quantity = item.quantity || 1;
          const unitPrice = item.unitPrice || item.finalPrice || item.price || 0;
          
          console.log(`Item ${index}: productId=${productId}, quantity=${quantity}, unitPrice=${unitPrice}`);
          
          return {
            productId: productId,
            quantity: quantity,
            unitPrice: unitPrice
          };
        }).filter(item => item !== null && item.productId && item.quantity > 0);
        
        console.log(`Vendor ${vendorGroup.vendorName}: ${items.length} valid items out of ${vendorGroup.items.length}`);

        if (items.length === 0) {
          errors.push(`No valid items for vendor ${vendorGroup.vendorName}`);
          continue;
        }

        try {
          const res = await apiFetch('/api/products/create-purchase-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vendorId: vendorGroup.vendorId,
              items: items,
              paymentTerms: paymentMethod === 'net_30' ? 'Net 30' : 
                           paymentMethod === 'net_45' ? 'Net 45' : 
                           paymentMethod === 'net_60' ? 'Net 60' : 
                           paymentMethod === 'cash' ? 'Cash on Delivery' : 
                           'Advance Payment',
              notes: `Order created by ${user?.name || 'Depot Manager'} from depot`,
            })
          });

          if (res.ok) {
            const success = res.data?.success || (res.data?.data && res.data.data.success);
            const purchaseOrder = res.data?.data?.purchaseOrder || res.data?.purchaseOrder || res.data?.data;
            if (success && purchaseOrder) {
              createdOrders.push(purchaseOrder);
            } else {
              errors.push(`Failed to create PO for ${vendorGroup.vendorName}: ${res.data?.message || 'Unknown error'}`);
            }
          } else {
            errors.push(`Failed to create PO for ${vendorGroup.vendorName}: ${res.data?.message || res.message || 'Unknown error'}`);
          }
        } catch (vendorError) {
          console.error(`Error creating PO for vendor ${vendorGroup.vendorName}:`, vendorError);
          errors.push(`Error creating PO for ${vendorGroup.vendorName}: ${vendorError.message || 'Unknown error'}`);
        }
      }

      if (createdOrders.length > 0) {
        // Clear cart after successful order creation
        try {
          await apiFetch('/api/cart/clear', { method: 'DELETE' });
        } catch (clearError) {
          console.error('Error clearing cart:', clearError);
          // Don't fail the whole operation if cart clear fails
        }
        
        await Promise.all([fetchCart(), fetchProducts(), fetchPurchaseOrders()]);
        
        if (errors.length > 0) {
          toast.success(`Created ${createdOrders.length} purchase order(s) with ${errors.length} error(s)`, {
            duration: 4000
          });
          console.error('PO creation errors:', errors);
        } else {
          toast.success(`Successfully created ${createdOrders.length} purchase order(s)!`);
        }
        
        setActiveTab('orders');
      } else {
        toast.error(`Failed to create purchase orders. ${errors.length > 0 ? errors.join('; ') : 'No orders created'}`);
      }
    } catch (error) {
      console.error('Place order error:', error);
      toast.error(`Failed to create purchase orders: ${error.message || 'Unknown error'}`);
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
        <button
          onClick={() => setActiveTab('deliveries')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'deliveries' ? '3px solid #ec4899' : '3px solid transparent',
            color: activeTab === 'deliveries' ? '#ec4899' : '#64748b',
            fontWeight: activeTab === 'deliveries' ? 600 : 400,
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <Truck style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} size={18} />
          Deliveries
          {deliveries.length > 0 && (
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
              {deliveries.length}
            </span>
          )}
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
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ color: '#64748b', marginTop: '16px' }}>Loading products...</p>
            </div>
          ) : (
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
          )}

          {!loadingProducts && filteredProducts.length === 0 && (
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
                      // Get item ID - prioritize _id from cart item (MongoDB ObjectId)
                      const itemId = item._id?.toString() || 
                                    item.id?.toString() || 
                                    item.itemId?.toString() || 
                                    `item-${vendorGroup.vendorId}-${itemIndex}`;
                      
                      // Get product name - handle both populated and non-populated
                      const productName = item.productName || 
                                        item.productId?.productName || 
                                        'Product';
                      
                      // Get price - handle multiple possible fields
                      const unitPrice = item.unitPrice || 
                                      item.finalPrice || 
                                      item.price || 
                                      item.productId?.finalPrice || 
                                      item.productId?.basePrice || 
                                      0;
                      
                      const quantity = item.quantity || 1;
                      const itemTotal = unitPrice * quantity;
                      
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
                              {productName}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                              ₹{unitPrice.toLocaleString('en-IN')} each
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
                              onClick={() => handleUpdateQuantity(itemId, quantity - 1)}
                              disabled={updating}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '6px',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                opacity: updating ? 0.6 : 1
                              }}
                            >
                              <Minus size={16} />
                            </button>
                            <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>
                              {quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(itemId, quantity + 1)}
                              disabled={updating}
                              style={{
                                padding: '6px 10px',
                                border: 'none',
                                background: '#f1f5f9',
                                borderRadius: '6px',
                                cursor: updating ? 'not-allowed' : 'pointer',
                                opacity: updating ? 0.6 : 1
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span style={{ minWidth: '100px', textAlign: 'right', fontWeight: 600 }}>
                            ₹{itemTotal.toLocaleString('en-IN')}
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
                              cursor: updating ? 'not-allowed' : 'pointer',
                              opacity: updating ? 0.6 : 1
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
                
                {/* Payment Method Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    <CreditCard style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} size={16} />
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="net_30">Net 30 Days</option>
                    <option value="net_45">Net 45 Days</option>
                    <option value="net_60">Net 60 Days</option>
                    <option value="cash">Cash on Delivery</option>
                    <option value="advance">Advance Payment</option>
                  </select>
                </div>
                
                {/* Workflow Indicator */}
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: '#0369a1'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>📋 Purchase Order Workflow:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>1. Depot Creates PO</span>
                    <span>→</span>
                    <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>2. Admin Approves</span>
                    <span>→</span>
                    <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>3. Vendor Fulfills</span>
                  </div>
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
                    cursor: updating || vendorGroups.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {updating ? (
                    <>Creating Purchase Order...</>
                  ) : (
                    <>
                      <FileText size={18} />
                      Create Purchase Order
                    </>
                  )}
                </button>
                <p style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#64748b', 
                  textAlign: 'center' 
                }}>
                  PO will be sent to Admin for approval before vendor receives it
                </p>
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
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#0369a1' }}>
              🏭 Purchase Order Flow (Depot → Admin → Vendor)
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              <strong>You (Depot)</strong> create POs → <strong>Admin</strong> approves → <strong>Vendor</strong> receives and fulfills
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>My Purchase Orders</h3>
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

      {/* Deliveries Tab - Shows dispatched POs waiting for payment/delivery */}
      {activeTab === 'deliveries' && (
        <div>
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              🚚 Delivery Workflow: Payment Required Before Delivery
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#78350f' }}>
              <strong>Step 1:</strong> Vendor dispatches product → <strong>Step 2:</strong> Depot makes payment → <strong>Step 3:</strong> Delivery can start
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Dispatched Deliveries</h3>
            <button
              onClick={fetchDeliveries}
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

          {loadingDeliveries ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ color: '#64748b', marginTop: '16px' }}>Loading deliveries...</p>
            </div>
          ) : deliveries.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px'
            }}>
              {deliveries.map((po) => {
                const isAwaitingPayment = po.status === 'dispatched_awaiting_payment';
                const isReadyForDelivery = po.status === 'in_progress' && po.deliveryStatus?.status === 'in_transit';
                // Check payment status from invoice if available, otherwise from PO
                const paymentStatus = po.invoiceId?.paymentStatus || po.paymentStatus || po.invoiceStatus || 'pending';
                const isPaid = paymentStatus === 'paid';
                const invoiceId = po.invoiceId?._id || po.invoiceId || null;
                const invoiceNumber = po.invoiceId?.invoiceNumber || po.invoiceNumber || null;

                return (
                  <div key={po._id} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                          {po.poNumber}
                        </h4>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: '#64748b' }}>
                          Vendor: {po.vendorId?.companyName || po.vendorName || 'N/A'}
                        </p>
                      </div>
                      <div style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isAwaitingPayment ? '#fef3c7' : isReadyForDelivery ? '#d1fae5' : '#e0e7ff',
                        color: isAwaitingPayment ? '#92400e' : isReadyForDelivery ? '#065f46' : '#3730a3'
                      }}>
                        {isAwaitingPayment ? '⏳ Awaiting Payment' : isReadyForDelivery ? '✅ Ready for Delivery' : 'In Transit'}
                      </div>
                    </div>

                    {/* Payment Section - Prominent Display */}
                    <div style={{
                      marginBottom: '16px',
                      padding: '16px',
                      background: isPaid ? '#d1fae5' : '#fef3c7',
                      border: `1px solid ${isPaid ? '#10b981' : '#fbbf24'}`,
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <DollarSign size={18} style={{ color: isPaid ? '#10b981' : '#f59e0b' }} />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: isPaid ? '#065f46' : '#92400e' }}>
                            Payment Status
                          </span>
                        </div>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '6px',
                          background: isPaid ? '#10b981' : '#ef4444',
                          color: 'white'
                        }}>
                          {isPaid ? '✅ PAID' : '❌ PENDING'}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Amount:</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                          ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      {invoiceNumber && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Invoice:</span>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                            {invoiceNumber}
                          </span>
                        </div>
                      )}
                      
                      {!isPaid && invoiceId && (
                        <button
                          onClick={() => handleMarkPaymentReceived({ ...po, invoiceId })}
                          style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '10px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#059669'}
                          onMouseOut={(e) => e.target.style.background = '#10b981'}
                        >
                          <DollarSign size={16} />
                          Mark Payment as Received
                        </button>
                      )}
                      
                      {!isPaid && !invoiceId && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px',
                          background: '#fee2e2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#991b1b',
                          textAlign: 'center'
                        }}>
                          ⚠️ Invoice not yet created. Please create invoice first.
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      {po.dispatchDate && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Dispatched:</span>
                          <span style={{ fontSize: '12px', color: '#1e293b' }}>
                            {new Date(po.dispatchDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {po.trackingNumber && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>LR Number:</span>
                          <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 600 }}>
                            {po.trackingNumber}
                          </span>
                        </div>
                      )}
                      {po.shippingMethod && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Vehicle:</span>
                          <span style={{ fontSize: '12px', color: '#1e293b' }}>
                            {po.shippingMethod}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Total Amount:</span>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#ec4899' }}>
                          ₹{(po.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {isAwaitingPayment && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '12px'
                      }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
                          ⚠️ Payment Required: Please mark payment as received in Payment Tracking to start delivery
                        </p>
                      </div>
                    )}

                    {isReadyForDelivery && (
                      <button
                        onClick={() => handleConfirmDelivery(po._id)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <CheckCircle size={18} />
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Truck size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
              <p style={{ color: '#64748b' }}>No dispatched deliveries at the moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPurchasing;
