import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Package, ArrowLeft, Save, X, Filter, Download, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const AdminProductsManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: '',
    basePrice: '',
    stock: { quantity: '', minQuantity: '10', unit: 'units' },
    taxRate: '18',
    discount: '0',
    brand: '',
    vendorId: '',
    status: 'active',
    productCode: ''
  });

  const categories = [
    'bus_parts', 'engine', 'transmission', 'brakes', 'suspension',
    'electrical', 'body', 'interior', 'exterior', 'tires', 'battery',
    'filters', 'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers',
    'tools', 'equipment', 'consumables', 'other'
  ];

  const units = ['units', 'kg', 'liters', 'meters', 'pieces', 'boxes', 'packs'];

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
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        stock: {
          quantity: parseFloat(formData.stock.quantity) || 0,
          minQuantity: parseFloat(formData.stock.minQuantity) || 10,
          unit: formData.stock.unit || 'units'
        },
        taxRate: parseFloat(formData.taxRate) || 18,
        discount: parseFloat(formData.discount) || 0
      };

      const response = await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });

      if (response.ok && response.data.success) {
        toast.success('Product created successfully');
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      } else {
        toast.error(response.data?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product._id);
    setFormData({
      productName: product.productName || '',
      description: product.description || '',
      category: product.category || '',
      basePrice: product.basePrice || '',
      stock: {
        quantity: product.stock?.quantity || '',
        minQuantity: product.stock?.minQuantity || '10',
        unit: product.stock?.unit || 'units'
      },
      taxRate: product.taxRate || '18',
      discount: product.discount || '0',
      brand: product.brand || '',
      vendorId: product.vendorId?._id || product.vendorId || '',
      status: product.status || 'active',
      productCode: product.productCode || ''
    });
  };

  const handleUpdateProduct = async (productId, e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        stock: {
          quantity: parseFloat(formData.stock.quantity) || 0,
          minQuantity: parseFloat(formData.stock.minQuantity) || 10,
          unit: formData.stock.unit || 'units'
        },
        taxRate: parseFloat(formData.taxRate) || 18,
        discount: parseFloat(formData.discount) || 0
      };

      const response = await apiFetch(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });

      if (response.ok && response.data.success) {
        toast.success('Product updated successfully');
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      } else {
        toast.error(response.data?.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok && response.data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(response.data?.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const response = await apiFetch('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (response.ok && response.data.success) {
        toast.success('Product added to cart');
        navigate('/admin/bulk-cart');
      } else {
        toast.error(response.data?.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      description: '',
      category: '',
      basePrice: '',
      stock: { quantity: '', minQuantity: '10', unit: 'units' },
      taxRate: '18',
      discount: '0',
      brand: '',
      vendorId: '',
      status: 'active',
      productCode: ''
    });
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
          <button
            onClick={() => navigate('/admin/bulk-cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage all products - Create, Read, Update, Delete</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
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
            <p className="text-gray-600">No products match your filters.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={formData.productName}
                              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Product Name"
                            />
                            <input
                              type="text"
                              value={formData.productCode}
                              onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Product Code"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                            <div className="text-sm text-gray-500">{product.productCode}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <select
                            value={formData.vendorId}
                            onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Vendor</option>
                            {vendors.map(vendor => (
                              <option key={vendor._id} value={vendor._id}>{vendor.companyName || vendor.email}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-900">{product.vendorName || product.vendorId?.companyName || 'N/A'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat.replace(/_/g, ' ').toUpperCase()}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-gray-900">{product.category?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={formData.basePrice}
                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Price"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(product.finalPrice || product.basePrice)}</div>
                            {product.discount > 0 && (
                              <div className="text-xs text-gray-500">Discount: {product.discount}%</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            value={formData.stock.quantity}
                            onChange={(e) => setFormData({ ...formData, stock: { ...formData.stock, quantity: e.target.value } })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Stock"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{product.stock?.quantity || 0} {product.stock?.unit || 'units'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product._id ? (
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="out_of_stock">Out of Stock</option>
                          </select>
                        ) : (
                          getStatusBadge(product.status)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingProduct === product._id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleUpdateProduct(product._id, e)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(null);
                                resetForm();
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAddToCart(product._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Add to Cart"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Add New Product</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor._id} value={vendor._id}>{vendor.companyName || vendor.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace(/_/g, ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock.quantity}
                    onChange={(e) => setFormData({ ...formData, stock: { ...formData.stock, quantity: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit</label>
                  <select
                    value={formData.stock.unit}
                    onChange={(e) => setFormData({ ...formData, stock: { ...formData.stock, unit: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsManagement;
