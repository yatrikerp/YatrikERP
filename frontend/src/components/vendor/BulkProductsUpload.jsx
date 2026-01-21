import React, { useState } from 'react';
import { Upload, X, Plus, Trash2, CheckCircle, AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const BulkProductsUpload = ({ onSuccess, onClose }) => {
  const [products, setProducts] = useState([{
    productName: '',
    description: '',
    category: '',
    basePrice: '',
    stock: { quantity: '', minQuantity: '10', unit: 'units' },
    taxRate: '18',
    discount: '0',
    brand: '',
    status: 'draft'
  }]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'bus_parts', 'engine', 'transmission', 'brakes', 'suspension',
    'electrical', 'body', 'interior', 'exterior', 'tires', 'battery',
    'filters', 'fluids', 'belts', 'hoses', 'lights', 'mirrors', 'wipers',
    'tools', 'equipment', 'consumables', 'other'
  ];

  const units = ['units', 'kg', 'liters', 'meters', 'pieces', 'boxes', 'packs'];

  const addProduct = () => {
    setProducts([...products, {
      productName: '',
      description: '',
      category: '',
      basePrice: '',
      stock: { quantity: '', minQuantity: '10', unit: 'units' },
      taxRate: '18',
      discount: '0',
      brand: '',
      status: 'draft'
    }]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updateProduct = (index, field, value) => {
    const updated = [...products];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent] = { ...updated[index][parent], [child]: value };
    } else {
      updated[index][field] = value;
    }
    setProducts(updated);
    
    // Clear error for this field
    if (errors[index] && errors[index][field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  const validateProducts = () => {
    const newErrors = {};
    products.forEach((product, index) => {
      const productErrors = {};
      if (!product.productName.trim()) {
        productErrors.productName = 'Product name is required';
      }
      if (!product.category) {
        productErrors.category = 'Category is required';
      }
      if (!product.basePrice || parseFloat(product.basePrice) <= 0) {
        productErrors.basePrice = 'Valid base price is required';
      }
      if (product.stock.quantity && parseFloat(product.stock.quantity) < 0) {
        productErrors['stock.quantity'] = 'Stock quantity cannot be negative';
      }
      if (Object.keys(productErrors).length > 0) {
        newErrors[index] = productErrors;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProducts()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    setUploading(true);
    try {
      const productsToSubmit = products.map(p => ({
        productName: p.productName.trim(),
        description: p.description.trim(),
        category: p.category,
        basePrice: parseFloat(p.basePrice),
        stock: {
          quantity: parseFloat(p.stock.quantity) || 0,
          minQuantity: parseFloat(p.stock.minQuantity) || 10,
          unit: p.stock.unit || 'units'
        },
        taxRate: parseFloat(p.taxRate) || 18,
        discount: parseFloat(p.discount) || 0,
        brand: p.brand.trim(),
        status: p.status || 'draft'
      }));

      const response = await apiFetch('/api/products/bulk', {
        method: 'POST',
        body: JSON.stringify({ products: productsToSubmit })
      });

      if (response.ok && response.data.success) {
        const { created, failed, errors: submitErrors } = response.data.data;
        if (created > 0) {
          toast.success(`Successfully created ${created} product(s)${failed > 0 ? `, ${failed} failed` : ''}`);
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        } else {
          toast.error('Failed to create products. Please check the errors.');
        }
        if (submitErrors && submitErrors.length > 0) {
          console.error('Product creation errors:', submitErrors);
        }
      } else {
        toast.error(response.data?.message || 'Failed to create products');
      }
    } catch (error) {
      console.error('Error creating products:', error);
      toast.error('Failed to create products. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      ['Product Name', 'Description', 'Category', 'Base Price', 'Stock Quantity', 'Stock Unit', 'Tax Rate (%)', 'Discount (%)', 'Brand', 'Status'],
      ['Example Product 1', 'Product description', 'bus_parts', '1000', '50', 'units', '18', '0', 'Brand Name', 'draft'],
      ['Example Product 2', 'Another product', 'engine', '2000', '30', 'pieces', '18', '5', 'Brand Name', 'active']
    ];

    let csv = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-products-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Bulk Add Products</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={18} />
              Download Template
            </button>
            <button
              onClick={addProduct}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {products.map((product, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Product #{index + 1}</h3>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={product.productName}
                      onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.productName ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors[index]?.productName && (
                      <p className="text-red-500 text-xs mt-1">{errors[index].productName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={product.category}
                      onChange={(e) => updateProduct(index, 'category', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.category ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace(/_/g, ' ').toUpperCase()}</option>
                      ))}
                    </select>
                    {errors[index]?.category && (
                      <p className="text-red-500 text-xs mt-1">{errors[index].category}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={product.description}
                      onChange={(e) => updateProduct(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.basePrice}
                      onChange={(e) => updateProduct(index, 'basePrice', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.basePrice ? 'border-red-500' : 'border-gray-300'}`}
                      required
                    />
                    {errors[index]?.basePrice && (
                      <p className="text-red-500 text-xs mt-1">{errors[index].basePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={product.brand}
                      onChange={(e) => updateProduct(index, 'brand', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={product.stock.quantity}
                      onChange={(e) => updateProduct(index, 'stock.quantity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${errors[index]?.['stock.quantity'] ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors[index]?.['stock.quantity'] && (
                      <p className="text-red-500 text-xs mt-1">{errors[index]['stock.quantity']}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Unit
                    </label>
                    <select
                      value={product.stock.unit}
                      onChange={(e) => updateProduct(index, 'stock.unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={product.taxRate}
                      onChange={(e) => updateProduct(index, 'taxRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={product.discount}
                      onChange={(e) => updateProduct(index, 'discount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={product.status}
                      onChange={(e) => updateProduct(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </form>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Upload size={18} />
                Create {products.length} Product(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkProductsUpload;
