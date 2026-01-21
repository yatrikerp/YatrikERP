import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Star,
  Package,
  Gavel,
  CreditCard,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const SmartBulkCart = ({ isOpen = true, onClose }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [vendorGroups, setVendorGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    if (isOpen && (user?.role === 'admin' || user?.role === 'depot_manager')) {
      fetchCart();
    }
  }, [isOpen, user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/cart/enhanced');
      
      if (res.ok) {
        setCart(res.data.cart);
        setVendorGroups(res.data.vendorGroups || []);
        setCartTotal(res.data.summary?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
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

  const handlePlaceOrder = () => {
    // Navigate to checkout or create order directly
    window.location.href = '/admin/orders/create-from-cart';
  };

  const handleConvertToAuction = () => {
    // Navigate to auction creation
    window.location.href = '/admin/auctions/create-from-cart';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    
    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
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

  // Hide cart for vendors and other roles
  if (!user || (user.role !== 'admin' && user.role !== 'depot_manager')) {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gradient-to-b from-blue-900 to-blue-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-blue-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Bulk Cart</h2>
          <p className="text-sm text-blue-200">
            {user.role === 'admin' ? 'Admin Cart' : 'Depot Cart'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : vendorGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="w-16 h-16 text-blue-300 mb-4" />
            <p className="text-blue-200 text-sm">Your cart is empty</p>
            <p className="text-blue-300 text-xs mt-1">Add products to get started</p>
          </div>
        ) : (
          vendorGroups.map((vendorGroup) => (
            <div key={vendorGroup.vendorId} className="space-y-3 mb-4">
              {/* Vendor Group Header */}
              <div className="text-xs font-semibold text-blue-200 uppercase tracking-wide px-2">
                {vendorGroup.vendorName}
              </div>

              {/* Items from this vendor */}
              {vendorGroup.items.map((item, idx) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg p-4 shadow-lg border border-blue-100"
                >
                  {/* Product Info */}
                  <div className="flex items-start space-x-3 mb-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                        {item.productName}
                      </h3>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-600">{item.vendorName}</span>
                        {renderStars(item.vendorRating || 4)}
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                          MOQ: {item.moq || 50} Units
                        </span>
                        {item.schemeInfo && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium flex items-center space-x-1">
                            <TrendingDown className="w-3 h-3" />
                            <span>{item.schemeInfo.message || 'Scheme Applied'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1) - 1)}
                        disabled={updating}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold text-gray-900 w-12 text-center">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1) + 1)}
                        disabled={updating}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 text-gray-700 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(item.total || item.subtotal || 0)}
                      </div>
                      {item.schemeDiscount > 0 && (
                        <div className="text-xs text-green-600">
                          (incl. Discount)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="w-full py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {vendorGroups.length > 0 && (
        <div className="border-t border-blue-700 bg-blue-800 px-4 py-4 space-y-3">
          {/* Cart Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">Cart Total:</span>
            <span className="text-xl font-bold text-white">
              {formatCurrency(cartTotal)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handlePlaceOrder}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Place Order</span>
            </button>
            <button
              onClick={handleConvertToAuction}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Gavel className="w-5 h-5" />
              <span>Convert to Auction</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartBulkCart;
