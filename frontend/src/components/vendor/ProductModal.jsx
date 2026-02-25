import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, FileText, Upload as UploadIcon } from 'lucide-react';
import './ProductModal.css';

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    description: '',
    category: 'other',
    basePrice: '',
    taxRate: 18,
    stock: {
      quantity: 0,
      minQuantity: 10,
      unit: 'pieces'
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.productName || '',
        productCode: product.productCode || '',
        description: product.description || '',
        category: product.category || 'other',
        basePrice: product.basePrice || product.finalPrice || '',
        taxRate: product.taxRate || 18,
        stock: {
          quantity: product.stock?.quantity || 0,
          minQuantity: product.stock?.minQuantity || 10,
          unit: product.stock?.unit || 'pieces'
        }
      });
    }
  }, [product]);

  const validate = () => {
    const newErrors = {};
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    if (!formData.basePrice || isNaN(formData.basePrice) || parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = 'Valid price is required';
    }
    if (formData.taxRate < 0 || formData.taxRate > 100) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        taxRate: parseFloat(formData.taxRate),
        stock: {
          ...formData.stock,
          quantity: parseFloat(formData.stock.quantity),
          minQuantity: parseFloat(formData.stock.minQuantity)
        }
      });
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="close-btn-modern" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="form-section">
            <label className="form-label">
              <Package className="w-4 h-4" />
              Product Name *
            </label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className={`form-input ${errors.productName ? 'error' : ''}`}
              placeholder="Enter product name"
            />
            {errors.productName && <span className="error-text">{errors.productName}</span>}
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">Product Code</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                className="form-input"
                placeholder="Auto-generated if empty"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-input"
              >
                <option value="engine">Engine Parts</option>
                <option value="brake">Brake System</option>
                <option value="electrical">Electrical</option>
                <option value="body">Body Parts</option>
                <option value="tire">Tires & Wheels</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows="3"
              placeholder="Product description, specifications, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">
                <DollarSign className="w-4 h-4" />
                Base Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className={`form-input ${errors.basePrice ? 'error' : ''}`}
                placeholder="0.00"
              />
              {errors.basePrice && <span className="error-text">{errors.basePrice}</span>}
            </div>

            <div className="form-section">
              <label className="form-label">GST Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className={`form-input ${errors.taxRate ? 'error' : ''}`}
                placeholder="18"
              />
              {errors.taxRate && <span className="error-text">{errors.taxRate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                value={formData.stock.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, quantity: e.target.value }
                })}
                className="form-input"
                placeholder="0"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Min Quantity</label>
              <input
                type="number"
                value={formData.stock.minQuantity}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, minQuantity: e.target.value }
                })}
                className="form-input"
                placeholder="10"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Unit</label>
              <select
                value={formData.stock.unit}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, unit: e.target.value }
                })}
                className="form-input"
              >
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="liters">Liters</option>
                <option value="meters">Meters</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-modern btn-cancel-modern">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-modern btn-primary-modern">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
