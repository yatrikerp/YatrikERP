import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import productApiService from '../../services/productApiService';
import {
  ShoppingCart, Search, Filter, Star, Package, Plus, Minus,
  Heart, Share2, ShoppingBag, Truck, CheckCircle, X, ArrowLeft,
  Grid, List as ListIcon, SlidersHorizontal, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const VendorMarketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    inStock: true
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'bus_parts', label: 'Bus Parts' },
    { value: 'engine', label: 'Engine' },
    { value: 'transmission', label: 'Transmission' },
    { value: 'brakes', label: 'Brakes' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'tires', label: 'Tires' },
    { value: 'tools', label: 'Tools' },
    { value: 'equipment', label: 'Equipment' }
  ];

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, [searchQuery, selectedCategory, sortBy, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery,
        category: selectedCategory || undefined,
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price_low' ? 'finalPrice' : sortBy === 'price_high' ? '-finalPrice' : 'createdAt',
        sortOrder: sortBy === 'newest' ? 'desc' : 'asc',
        inStock: filters.inStock,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined
      };
      const response = await productApiService.getProducts(params);
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await productApiService.getCart();
      if (response.success) {
        setCart(response.data.cart);
        setCartCount(response.data.cart?.summary?.itemCount || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await productApiService.addToCart(productId, 1);
      if (response.success) {
        toast.success('Added to cart!');
        fetchCart();
      } else {
        toast.error(response.message || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-2 border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/vendor/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Product Marketplace
                </h1>
                <p className="text-sm text-gray-500">Buy & Sell Bus Parts & Equipment</p>
              </div>
            </div>

            {/* Cart Button */}
            <Link
              to="/vendor/cart"
              className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popularity">Most Popular</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center space-x-2 border-2 border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Price Filters */}
          <div className="mt-4 flex items-center space-x-4">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg w-32"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg w-32"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {products.map((product) => (
              <div
                key={product._id}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Product Image */}
                <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'w-full h-48'} bg-gray-100`}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].url}
                      alt={product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                      {product.discount}% OFF
                    </div>
                  )}
                  {product.stock.quantity === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Out of Stock</span>
                    </div>
                  )}
                  <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.productName}</h3>
                      <p className="text-xs text-gray-500">{product.vendorName}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.ratings?.average || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">({product.ratings?.count || 0})</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(product.finalPrice)}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.basePrice)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.stock.quantity} in stock
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      disabled={product.stock.quantity === 0}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                        product.stock.quantity === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                    <button className="p-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorMarketplace;
