import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Gift, Percent, Clock } from 'lucide-react';

const OffersPage = () => {
  const navigate = useNavigate();

  // Mock offers data - in real app, fetch from API
  const offers = [
    {
      id: 'O001',
      title: 'Early Bird Special',
      description: 'Book your tickets 7 days in advance and get 15% off',
      discount: '15% OFF',
      validUntil: '2024-12-31',
      terms: 'Valid for bookings made 7+ days in advance',
      color: 'bg-blue-500',
      icon: Clock
    },
    {
      id: 'O002',
      title: 'Weekend Warrior',
      description: 'Special discounts for weekend travel',
      discount: '₹200 OFF',
      validUntil: '2024-12-31',
      terms: 'Valid for Friday-Sunday travel',
      color: 'bg-green-500',
      icon: Star
    },
    {
      id: 'O003',
      title: 'Student Special',
      description: 'Exclusive discount for students',
      discount: '20% OFF',
      validUntil: '2024-12-31',
      terms: 'Valid with student ID',
      color: 'bg-purple-500',
      icon: Gift
    },
    {
      id: 'O004',
      title: 'First Time User',
      description: 'Welcome offer for new users',
      discount: '₹500 OFF',
      validUntil: '2024-12-31',
      terms: 'Valid for first booking only',
      color: 'bg-orange-500',
      icon: Percent
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/mobile')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Offers & Deals</h1>
            <p className="text-sm text-gray-600">Save more on your travels</p>
          </div>
        </div>
      </div>

      {/* Offers List */}
      <div className="p-4 space-y-4">
        {offers.map((offer) => {
          const IconComponent = offer.icon;
          return (
            <div key={offer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Offer Header */}
              <div className={`${offer.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{offer.title}</h3>
                      <p className="text-sm opacity-90">{offer.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{offer.discount}</div>
                    <div className="text-xs opacity-90">Valid until {new Date(offer.validUntil).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Offer Details */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{offer.terms}</p>
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(offer.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Use Offer
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* No More Offers */}
        <div className="text-center py-8">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">That's All for Now!</h3>
          <p className="text-gray-600">
            Check back regularly for new offers and deals
          </p>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;

