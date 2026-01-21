import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import InputField from '../../components/Common/InputField';
import PasswordField from '../../components/Common/PasswordField';
import { GraduationCap, Upload } from 'lucide-react';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    mobile: '',
    email: '',
    institutionName: '',
    course: '',
    year: '',
    semester: '',
    rollNumber: '',
    registerNumber: '',
    homeAddress: '',
    nearestBusStop: '',
    destinationBusStop: '',
    routeNumber: '',
    passDuration: '',
    password: '',
    confirmPassword: ''
  });
  const [files, setFiles] = useState({
    studentIdCard: null,
    bonafideCertificate: null,
    addressProof: null,
    photo: null
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
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^[\+]?[0-9]{7,15}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number';
    }
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.institutionName) newErrors.institutionName = 'Institution name is required';
    if (!formData.course) newErrors.course = 'Course/Class is required';
    if (!formData.rollNumber) newErrors.rollNumber = 'Roll number is required';
    if (!formData.homeAddress) newErrors.homeAddress = 'Home address is required';
    if (!formData.nearestBusStop) newErrors.nearestBusStop = 'Nearest bus stop is required';
    if (!formData.destinationBusStop) newErrors.destinationBusStop = 'Destination bus stop is required';
    if (!formData.passDuration) newErrors.passDuration = 'Pass duration is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 6 characters';
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

      const response = await apiFetch('/api/auth/register-student', {
        method: 'POST',
        body: formDataToSend
      });

      if (response && response.success) {
        toast.success(response.message || 'Registration submitted successfully!');
        toast.success('Your application is pending admin approval. You will be notified once approved.');
        navigate('/login');
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
            <GraduationCap className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">Student Pass Registration</h1>
          </div>
          <p className="text-sm text-gray-600">Register for your student bus pass</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="fullName"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleChange(e)}
                  error={errors.fullName}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>
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
                <InputField
                  id="email"
                  label="Email ID"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange(e)}
                  error={errors.email}
                  placeholder="student@example.com"
                  required
                  className="md:col-span-2"
                />
              </div>
            </div>

            {/* Educational Details Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Educational Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="institutionName"
                  label="Institution Name"
                  value={formData.institutionName}
                  onChange={(e) => handleChange(e)}
                  error={errors.institutionName}
                  required
                  className="md:col-span-2"
                />
                <InputField
                  id="course"
                  label="Course / Class"
                  value={formData.course}
                  onChange={(e) => handleChange(e)}
                  error={errors.course}
                  placeholder="e.g., B.Tech, 12th Grade"
                  required
                />
                <InputField
                  id="year"
                  label="Year"
                  value={formData.year}
                  onChange={(e) => handleChange(e)}
                  placeholder="e.g., 1st Year"
                />
                <InputField
                  id="semester"
                  label="Semester"
                  value={formData.semester}
                  onChange={(e) => handleChange(e)}
                  placeholder="e.g., 1st Semester"
                />
                <InputField
                  id="rollNumber"
                  label="Roll Number"
                  value={formData.rollNumber}
                  onChange={(e) => handleChange({ target: { name: 'rollNumber', value: e.target.value.toUpperCase() } })}
                  error={errors.rollNumber}
                  required
                />
                <InputField
                  id="registerNumber"
                  label="Register Number"
                  value={formData.registerNumber}
                  onChange={(e) => handleChange({ target: { name: 'registerNumber', value: e.target.value.toUpperCase() } })}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Travel Details Section */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Travel Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleChange}
                    rows={2}
                    className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.homeAddress ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.homeAddress && <p className="text-red-500 text-xs mt-1">{errors.homeAddress}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    id="nearestBusStop"
                    label="Nearest Bus Stop"
                    value={formData.nearestBusStop}
                    onChange={(e) => handleChange(e)}
                    error={errors.nearestBusStop}
                    required
                  />
                  <InputField
                    id="destinationBusStop"
                    label="Destination Bus Stop"
                    value={formData.destinationBusStop}
                    onChange={(e) => handleChange(e)}
                    error={errors.destinationBusStop}
                    required
                  />
                  <InputField
                    id="routeNumber"
                    label="Route Number"
                    value={formData.routeNumber}
                    onChange={(e) => handleChange(e)}
                    placeholder="Optional"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pass Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="passDuration"
                      value={formData.passDuration}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        errors.passDuration ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select duration</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    {errors.passDuration && <p className="text-red-500 text-xs mt-1">{errors.passDuration}</p>}
                  </div>
                </div>
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
                    Student ID Card <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="studentIdCard"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {files.studentIdCard && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.studentIdCard.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonafide Certificate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="bonafideCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {files.bonafideCertificate && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.bonafideCertificate.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Proof <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="addressProof"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {files.addressProof && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.addressProof.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo (Passport Size) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="photo"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {files.photo && (
                    <p className="text-xs text-green-600 mt-1">✓ {files.photo.name}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                <strong>Note:</strong> Maximum file size: 10MB per file. Accepted formats: PDF, JPEG, PNG.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Register for Student Pass'
                )}
              </button>
            </div>
          </form>

          {/* Back to Login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Already have an account? Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
