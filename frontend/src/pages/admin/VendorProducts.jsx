import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, CheckCircle, XCircle, Clock, Download, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const VendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    vendorId: '',
    status: '',
    category: '',
    page: 1,
    limit: 50
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [vendors, setVendors] = useState([]);

  const categories = [
    'bus_parts', 'engine', 'transmission', 'brakes', 'suspension',
    'electrical', 'body', 'interior', 'exterior', 'tires', 'battery',
    'filters', 'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers',
    'tools', 'equipment', 'consumables', 'other'
  ];

  useEffect(() => {
    fetchProducts();
    fetchVendors();
  }, [filters]);

  const fetchVendors = async () => {
    try {
      const response = await apiFetch('/api/vendor', {
        suppressError: true // Suppress 404 errors for admin pages
      });
      if (response.ok && response.data.success) {
        setVendors(response.data.data?.vendors || []);
      } else {
        // Try alternative endpoint for listing vendors
        const altResponse = await apiFetch('/api/admin/vendors', {
          suppressError: true
        });
        if (altResponse.ok && altResponse.data.success) {
          setVendors(altResponse.data.data?.vendors || altResponse.data.vendors || []);
        }
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.vendorId) params.append('vendorId', filters.vendorId);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await apiFetch(`/api/products/admin/all-vendor-products?${params.toString()}`, {
        suppressError: true // Suppress 404 errors
      });
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

  const getStatusBadge = (status) => {
    const config = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
      out_of_stock: { color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    };
    const statusConfig = config[status] || config.draft;
    const Icon = statusConfig.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vendor Products</h1>
          <p className="text-gray-600 mt-1">View and manage all products added by vendors</p>
        </div>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select
              value={filters.vendorId}
              onChange={(e) => setFilters({ ...filters, vendorId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>{vendor.companyName || vendor.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
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
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600">No vendor products match your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">{product.productCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.vendorName || product.vendorId?.companyName || 'N/A'}</div>
                        {product.vendorId?.email && (
                          <div className="text-sm text-gray-500">{product.vendorId.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.category?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(product.finalPrice || product.basePrice)}</div>
                        {product.discount > 0 && (
                          <div className="text-xs text-gray-500">Discount: {product.discount}%</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.stock?.quantity || 0} {product.stock?.unit || 'units'}</div>
                        {product.stock?.minQuantity && (
                          <div className="text-xs text-gray-500">Min: {product.stock.minQuantity}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
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
    </div>
  );
};

export default VendorProducts;
