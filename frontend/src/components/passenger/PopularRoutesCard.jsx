import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';
import { Bus, MapPin, ArrowRight } from 'lucide-react';

const PopularRoutesCard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const response = await apiFetch('/api/routes/popular?limit=10');
        
        console.log('Popular Routes API Response:', response); // Debug log
        
        // Handle apiFetch response format: response.data contains the API response
        if (response && response.ok && response.data && response.data.success && Array.isArray(response.data.data)) {
          // Use the original API response data directly
          setPopularRoutes(response.data.data);
        } else {
          console.log('Using fallback routes - API response issue:', response);
          // Fallback to default routes
          setPopularRoutes([
            { 
              routeId: 'default-1',
              routeName: 'Kochi to Bangalore',
              from: 'Kochi', 
              to: 'Bangalore', 
              minFare: 850, 
              label: 'Kochi → Bangalore',
              tripCount: 1,
              frequency: 'Multiple trips available'
            },
            { 
              routeId: 'default-2',
              routeName: 'Kochi to Chennai',
              from: 'Kochi', 
              to: 'Chennai', 
              minFare: 750, 
              label: 'Kochi → Chennai',
              tripCount: 1,
              frequency: 'Multiple trips available'
            },
            { 
              routeId: 'default-3',
              routeName: 'Kochi to Thiruvananthapuram',
              from: 'Kochi', 
              to: 'Thiruvananthapuram', 
              minFare: 450, 
              label: 'Kochi → Thiruvananthapuram',
              tripCount: 1,
              frequency: 'Multiple trips available'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching popular routes:', error);
        // Fallback to default routes
        setPopularRoutes([
          { 
            routeId: 'default-1',
            routeName: 'Kochi to Bangalore',
            from: 'Kochi', 
            to: 'Bangalore', 
            minFare: 850, 
            label: 'Kochi → Bangalore',
            tripCount: 1,
            frequency: 'Multiple trips available'
          }
        ]);
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchPopularRoutes();
  }, []);

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const handlePopularRouteClick = (route) => {
    // Navigate to the booking process with route details
    const params = new URLSearchParams({
      from: route.from,
      to: route.to,
      date: getYesterdayDate(), // Use yesterday's date for better trip availability
      passengers: 1,
      routeId: route.routeId,
      routeName: route.routeName,
      minFare: route.minFare
    });
    
    // Navigate to passenger search results page
    navigate(`/passenger/results?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <div className="bg-gradient-to-r from-[#FF416C] to-[#FF4B2B] p-2 rounded-lg shadow-lg">
            <Bus className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">Popular Routes</h2>
        </div>
        <p className="text-sm text-[#4B5563]">Most booked routes across India</p>
      </div>
      
      {loadingRoutes ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF416C] mx-auto mb-3"></div>
          <p className="text-sm text-[#4B5563]">Loading popular routes...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.isArray(popularRoutes) && popularRoutes.map((route, index) => (
            <div 
              key={index} 
              onClick={() => handlePopularRouteClick(route)}
              className="bg-gradient-to-r from-white to-[#F9FAFB] rounded-xl p-4 border border-[#E5E7EB] hover:border-[#FF416C] hover:shadow-lg hover:shadow-[#FF416C]/10 transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] p-2.5 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Bus className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#1A1A1A] text-sm truncate">
                      {route.from} → {route.to}
                    </h3>
                    <p className="text-xs text-[#4B5563] truncate">{route.frequency || 'Multiple operators available'}</p>
                    {route.availableSeats && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                        <span className="text-xs text-[#22C55E] font-medium">{route.availableSeats} seats available</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold text-[#1A1A1A]">
                    ₹{route.minFare}
                  </div>
                  <p className="text-xs text-[#4B5563]">{route.fare || 'Starting from'}</p>
                  <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowRight className="h-4 w-4 text-[#FF416C] mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!Array.isArray(popularRoutes) || popularRoutes.length === 0 ? (
            <div className="text-center py-6">
              <Bus className="h-8 w-8 text-[#4B5563] mx-auto mb-3" />
              <p className="text-sm text-[#4B5563]">No popular routes available</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PopularRoutesCard;
