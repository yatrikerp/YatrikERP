import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import InputField from '../../components/Common/InputField';
import PasswordField from '../../components/Common/PasswordField';
import { Building2 } from 'lucide-react';

const VendorRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: '',
    businessType: '',
    registrationNumber: '',
    panNumber: '',
    gstNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    authorizedPersonName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [files, setFiles] = useState({
    gstCertificate: null,
    tradeLicense: null,
    idProof: null,
    bankCheque: null
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, and PDF files are allowed');
        return;
      }
      setFiles(prev => ({ ...prev, [name]: file }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.vendorName) newErrors.vendorName = 'Vendor name is required';
    if (!formData.businessType) newErrors.businessType = 'Business type is required';
    if (!formData.panNumber) newErrors.panNumber = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber.toUpperCase())) {
      newErrors.gstNumber = 'Invalid GST format';
    }
    if (!formData.businessAddress) newErrors.businessAddress = 'Business address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode) newErrors.pincode = 'PIN code is required';
    else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid PIN code (6 digits)';
    }
    if (!formData.authorizedPersonName) newErrors.authorizedPersonName = 'Authorized person name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^[+]?[0-9]{7,15}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number';
    }
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword') {
          formDataToSend.append(key, formData[key]);
        }
      });

      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });

      const response = await apiFetch('/api/auth/register-vendor', {
        method: 'POST',
        body: formDataToSend
      });

      if (response && response.success) {
        toast.success(response.message || 'Registration successful!');
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          navigate('/vendor');
        } else {
          toast.success('Your registration is pending admin approval. You will be notified once approved.');
          navigate('/login');
        }
      } else {
        toast.error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
          </div>
          <p className="text-sm text-gray-600">Register your business to start working with YATRIK ERP</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Details Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="vendorName"
                  label="Vendor Name"
                  value={formData.vendorName}
                  onChange={(e) => handleChange(e)}
                  error={errors.vendorName}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.businessType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select type</option>
                    <option value="canteen">Canteen</option>
                    <option value="transport_partner">Transport Partner</option>
                    <option value="service_provider">Service Provider</option>
                  </select>
                  {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>}
                </div>
                <InputField
                  id="panNumber"
                  label="PAN Number"
                  value={formData.panNumber}
                  onChange={(e) => handleChange({ target: { name: 'panNumber', value: e.target.value.toUpperCase() } })}
                  error={errors.panNumber}
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  required
                />
                <InputField
                  id="gstNumber"
                  label="GST Number"
                  value={formData.gstNumber}
                  onChange={(e) => handleChange({ target: { name: 'gstNumber', value: e.target.value.toUpperCase() } })}
                  error={errors.gstNumber}
                  placeholder="22ABCDE1234F1Z5"
                />
                <InputField
                  id="registrationNumber"
                  label="Registration Number"
                  value={formData.registrationNumber}
                  onChange={(e) => handleChange(e)}
                  placeholder="Trade license (optional)"
                />
                <InputField
                  id="pincode"
                  label="PIN Code"
                  value={formData.pincode}
                  onChange={(e) => handleChange(e)}
                  error={errors.pincode}
                  maxLength={6}
                  placeholder="123456"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.businessAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete business address"
                />
                {errors.businessAddress && <p className="text-red-500 text-xs mt-1">{errors.businessAddress}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InputField
                  id="city"
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleChange(e)}
                  error={errors.city}
                  required
                />
                <InputField
                  id="state"
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleChange(e)}
                  error={errors.state}
                  required
                />
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="authorizedPersonName"
                  label="Authorized Person Name"
                  value={formData.authorizedPersonName}
                  onChange={(e) => handleChange(e)}
                  error={errors.authorizedPersonName}
                  required
                />
                <InputField
                  id="email"
                  label="Email ID"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange(e)}
                  error={errors.email}
                  placeholder="vendor@example.com"
                  required
                />
                <InputField
                  id="mobile"
                  label="Mobile Number"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange(e)}
                  error={errors.mobile}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            {/* Credentials Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Set Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordField
                  id="password"
                  label="Password"
                  value={formData.password}
                  onChange={(e) => handleChange(e)}
                  error={errors.password}
                  required
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange(e)}
                  error={errors.confirmPassword}
                  required
                />
              </div>
            </div>

            {/* Documents Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Upload Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Certificate / Trade License
                  </label>
                  <input
                    type="file"
                    name="gstCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {files.gstCertificate && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.gstCertificate.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trade License
                  </label>
                  <input
                    type="file"
                    name="tradeLicense"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {files.tradeLicense && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.tradeLicense.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Proof of Authorized Person
                  </label>
                  <input
                    type="file"
                    name="idProof"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {files.idProof && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.idProof.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Cancelled Cheque
                  </label>
                  <input
                    type="file"
                    name="bankCheque"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {files.bankCheque && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.bankCheque.name}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Note:</strong> Maximum file size: 10MB per file. Accepted formats: PDF, JPEG, PNG.
                {formData.gstNumber && formData.panNumber && (
                  <span className="block mt-1 text-blue-600">
                    If PAN and GST numbers match, your account will be auto-approved.
                  </span>
                )}
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Register as Vendor'
                )}
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Already have an account? Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
