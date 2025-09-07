import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Link, MapPin, Calendar, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './search-card.css';

const SearchCard = ({ onSearchResults, showResults = false }) => {
  const [activeTab, setActiveTab] = useState('book');
  const [tripType, setTripType] = useState('oneWay');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: '',
    returnDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();

  // Load cities on component mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const response = await fetch('/api/booking/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data.data.cities || []);
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.journeyDate) {
      toast.error('Please select the journey date');
      return;
    }

    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        date: formData.journeyDate,
        tripType: tripType
      });

      if (formData.from) queryParams.set('from', formData.from);
      if (formData.to) queryParams.set('to', formData.to);

      if (tripType === 'roundTrip' && formData.returnDate) {
        queryParams.append('returnDate', formData.returnDate);
      }

      // Redirect to results page with search parameters
      navigate(`/search-results?${queryParams.toString()}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed unused helpers to satisfy linter

  return (
    <div className="searchCard">
      {/* Tabs */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('book')}
          className={`tab ${activeTab === 'book' ? 'tab--active' : ''}`}
        >
          <Bus className="tab__icon" />
          <span className="hide-sm">Book Bus Ticket</span>
          <span className="show-sm">Book</span>
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`tab ${activeTab === 'link' ? 'tab--active' : ''}`}
        >
          <Link className="tab__icon" />
          <span className="hide-sm">Link Ticket</span>
          <span className="show-sm">Link</span>
        </button>
      </div>

      {/* Trip Type Toggle */}
      <div className="toggle">
        <button
          onClick={() => setTripType('oneWay')}
          className={`toggle__btn ${tripType === 'oneWay' ? 'is-active' : ''}`}
        >
          One Way
        </button>
        <button
          onClick={() => setTripType('roundTrip')}
          className={`toggle__btn ${tripType === 'roundTrip' ? 'is-active' : ''}`}
        >
          Round Trip
        </button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* From Location */}
        <div>
          <label className="label">
            From
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              type="text"
              value={formData.from}
              onChange={(e) => setFormData({...formData, from: e.target.value})}
              placeholder="Enter departure location"
              className="input"
              required
              list="cities-from"
            />
            <datalist id="cities-from">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* To Location */}
        <div>
          <label className="label">
            To
          </label>
          <div className="field">
            <MapPin className="field__icon" />
            <input
              type="text"
              value={formData.to}
              onChange={(e) => setFormData({...formData, to: e.target.value})}
              placeholder="Enter destination location"
              className="input"
              required
              list="cities-to"
            />
            <datalist id="cities-to">
              {cities.map((city, index) => (
                <option key={index} value={city} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Date Fields */}
        <div className="row-2">
          <div>
            <label className="label">
              Journey Date
            </label>
            <div className="field">
              <Calendar className="field__icon" />
              <input
                type="date"
                value={formData.journeyDate}
                onChange={(e) => setFormData({...formData, journeyDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="input"
                required
              />
            </div>
          </div>

          {tripType === 'roundTrip' && (
            <div>
              <label className="label">
                Return Date
              </label>
              <div className="field">
                <Calendar className="field__icon" />
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                  min={formData.journeyDate || new Date().toISOString().split('T')[0]}
                  className="input"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button type="submit" className="btnSearch" disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Searching...
            </>
          ) : (
            <>
              <Search className="btnSearch__icon" />
              Search buses
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchCard;
