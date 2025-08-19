import React, { useState } from 'react';
import { Bus, Link, MapPin, Calendar, Search } from 'lucide-react';
import './search-card.css';

const SearchCard = () => {
  const [activeTab, setActiveTab] = useState('book');
  const [tripType, setTripType] = useState('oneWay');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    journeyDate: '',
    returnDate: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search submitted:', formData);
  };

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
            />
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
            />
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
      <button type="submit" className="btnSearch">
          <Search className="btnSearch__icon" />
          Search buses
      </button>
      </form>
    </div>
  );
};

export default SearchCard;
