import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import productApiService from '../../services/productApiService';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const VendorCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await productApiService.getCart();
      if (response.success) {
        setCart(response.data.cart);
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
      const response = await productApiService.updateCartItem(itemId, newQuantity);
      if (response.success) {
        setCart(response.data.cart);
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
      const response = await productApiService.removeFromCart(itemId);
      if (response.success) {
        setCart(response.data.cart);
        toast.success('Item removed');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    navigate('/vendor/checkout');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingCart className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Link
              to="/vendor/marketplace"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/vendor/marketplace"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
              <p className="text-gray-600">{cart.summary.itemCount} items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.productName}</h3>
                    <p className="text-sm text-gray-500 mb-2">{item.vendorName}</p>
                    <p className="text-sm text-gray-600 mb-4">Code: {item.productCode}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                          className="p-1 border-2 border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                          className="p-1 border-2 border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} each</p>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.summary.itemCount} items)</span>
                  <span>{formatCurrency(cart.summary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST)</span>
                  <span>{formatCurrency(cart.summary.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{formatCurrency(cart.summary.shippingCharges || 0)}</span>
                </div>
                {cart.summary.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.summary.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(cart.summary.total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-lg"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>

              <Link
                to="/vendor/marketplace"
                className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCart;
