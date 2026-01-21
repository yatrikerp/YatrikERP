import React, { useState, useEffect } from 'react';
import { Search, Package, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const DepotVendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    vendorId: '',
    category: '',
    inStock: 'true',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const categories = [
    'bus_parts', 'engine', 'transmission', 'brakes', 'suspension',
    'electrical', 'body', 'interior', 'exterior', 'tires', 'battery',
    'filters', 'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers',
    'tools', 'equipment', 'consumables', 'other'
  ];

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.vendorId) params.append('vendorId', filters.vendorId);
      if (filters.category) params.append('category', filters.category);
      if (filters.inStock) params.append('inStock', filters.inStock);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await apiFetch(`/api/products/depot/vendor-products?${params.toString()}`);
      if (response.ok && response.data.success) {
        setProducts(response.data.data.products || []);
        setPagination(response.data.data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load vendor products');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (response.ok && response.data.success) {
        toast.success('Product added to cart');
      } else {
        toast.error(response.data?.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vendor Products</h1>
          <p className="text-gray-600 mt-1">Browse and order products from approved vendors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={filters.inStock}
              onChange={(e) => setFilters({ ...filters, inStock: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="true">In Stock Only</option>
              <option value="">All Products</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
          <p className="text-gray-600">No vendor products match your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.productName}</h3>
                      <p className="text-sm text-gray-500">{product.productCode}</p>
                    </div>
                    {product.status === 'active' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{product.category?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Vendor:</span>
                      <span className="font-medium text-gray-900">{product.vendorName || product.vendorId?.companyName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium text-gray-900">{product.stock?.quantity || 0} {product.stock?.unit || 'units'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(product.finalPrice || product.basePrice)}</span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(product.basePrice)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={!product.stock?.quantity || product.stock.quantity === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DepotVendorProducts;
