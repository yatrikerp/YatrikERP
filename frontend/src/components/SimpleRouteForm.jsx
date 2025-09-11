import React, { useState, useEffect } from 'react';
import { X, Plus, MapPin, Clock, DollarSign, Bus } from 'lucide-react';

const SimpleRouteForm = ({ isOpen, onClose, route = null, mode = 'create', onSubmit }) => {
  const [formData, setFormData] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: '',
    endingPoint: '',
    distance: 0,
    duration: 0,
    baseFare: 0,
    type: 'ordinary',
    status: 'active',
    features: [],
  });

  useEffect(() => {
    if (route && mode === 'edit') {
      setFormData({
        routeNumber: route.routeNumber || '',
        routeName: route.routeName || '',
        startingPoint: route.startingPoint || '',
        endingPoint: route.endingPoint || '',
        distance: route.distance || 0,
        duration: route.duration || 0,
        baseFare: route.baseFare || 0,
        type: route.type || 'ordinary',
        status: route.status || 'active',
        features: route.features || [],
      });
    }
  }, [route, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const addFeature = () => {
    const newFeature = prompt('Enter feature name:');
    if (newFeature) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content route-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'create' ? 'Add New Route' : 'Edit Route'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="route-form">
          <div className="form-grid">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Route Number *</label>
                  <input
                    type="text"
                    name="routeNumber"
                    value={formData.routeNumber}
                    onChange={handleChange}
                    placeholder="e.g., RT001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Route Name *</label>
                  <input
                    type="text"
                    name="routeName"
                    value={formData.routeName}
                    onChange={handleChange}
                    placeholder="e.g., Kochi to Kollam"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Starting Point *</label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input
                      type="text"
                      name="startingPoint"
                      value={formData.startingPoint}
                      onChange={handleChange}
                      placeholder="e.g., Kochi"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Ending Point *</label>
                  <div className="input-with-icon">
                    <MapPin size={18} />
                    <input
                      type="text"
                      name="endingPoint"
                      value={formData.endingPoint}
                      onChange={handleChange}
                      placeholder="e.g., Kollam"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Route Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Distance (km) *</label>
                  <div className="input-with-icon">
                    <Bus size={18} />
                    <input
                      type="number"
                      name="distance"
                      value={formData.distance}
                      onChange={handleChange}
                      placeholder="157"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <div className="input-with-icon">
                    <Clock size={18} />
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="150"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Base Fare (₹) *</label>
                  <div className="input-with-icon">
                    <DollarSign size={18} />
                    <input
                      type="number"
                      name="baseFare"
                      value={formData.baseFare}
                      onChange={handleChange}
                      placeholder="200"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Route Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="ordinary">Ordinary</option>
                    <option value="semi-deluxe">Semi-Deluxe</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Features</h3>
              <div className="features-container">
                {formData.features.map((feature, index) => (
                  <div key={index} className="feature-tag">
                    <span>{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="remove-feature-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="add-feature-btn"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
            >
              {mode === 'create' ? 'Create Route' : 'Update Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleRouteForm;
