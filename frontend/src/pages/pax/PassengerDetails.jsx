import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle } from 'lucide-react';

const PassengerDetails = () => {
  const { tripId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const trip = state?.trip || {};
  const boarding = state?.boarding || null;
  const dropping = state?.dropping || null;
  
  const [passengerDetails, setPassengerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male'
  });
  
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setPassengerDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!passengerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!passengerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(passengerDetails.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!passengerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(passengerDetails.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!passengerDetails.age.trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(passengerDetails.age) || parseInt(passengerDetails.age) < 1 || parseInt(passengerDetails.age) > 120) {
      newErrors.age = 'Please enter a valid age';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      navigate(`/pax/seats/${tripId}`, {
        state: { 
          trip, 
          boarding, 
          dropping,
          passengerDetails,
          passengerGender: passengerDetails.gender
        }
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/pax/board-drop/${tripId}`, { state: { trip, boarding, dropping } })}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Boarding Points</span>
            </button>
            <div className="text-sm text-gray-600">
              Step 3 of 4
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Summary</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {trip.fromCity || trip.routeName} → {trip.toCity || 'Destination'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatTime(trip.startTime)} - {formatTime(trip.endTime)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(trip.serviceDate)}
                  </p>
                </div>
                
                {boarding && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-900">Boarding Point</p>
                    <p className="text-sm text-gray-600">{boarding.title}</p>
                    <p className="text-xs text-gray-500">Pickup: {boarding.time}</p>
                  </div>
                )}
                
                {dropping && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-900">Drop Point</p>
                    <p className="text-sm text-gray-600">{dropping.title}</p>
                    <p className="text-xs text-gray-500">Drop: {dropping.time}</p>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Fare per seat</span>
                    <span className="text-sm font-medium text-gray-900">₹{trip.fare || 499}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">Route: {trip.routeName || 'N/A'}</span>
                    <span className="text-xs text-gray-500">Distance: {trip.distanceKm || 'N/A'} km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Passenger Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Passenger Details</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Please provide your details for booking confirmation
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={passengerDetails.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={passengerDetails.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={passengerDetails.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={passengerDetails.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.age ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                    />
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={passengerDetails.gender === 'male'}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Male</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={passengerDetails.gender === 'female'}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Female</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This will determine the seat selection color (Blue for Male, Pink for Female)
                    </p>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleContinue}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <span>Continue to Seat Selection</span>
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
