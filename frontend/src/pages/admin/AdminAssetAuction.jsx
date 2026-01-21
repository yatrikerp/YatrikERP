import React, { useState, useEffect } from 'react';
import { 
  Gavel, 
  Bus, 
  Package,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminAssetAuction = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/auctions');
      if (res.ok) {
        setAuctions(res.data.auctions || []);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAuction = async (auctionData) => {
    try {
      const res = await apiFetch('/api/admin/auctions', {
        method: 'POST',
        body: JSON.stringify(auctionData)
      });
      if (res.ok) {
        fetchAuctions();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating auction:', error);
    }
  };

  const approveAuction = async (auctionId) => {
    try {
      const res = await apiFetch(`/api/admin/auctions/${auctionId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error approving auction:', error);
    }
  };

  const closeAuction = async (auctionId) => {
    try {
      const res = await apiFetch(`/api/admin/auctions/${auctionId}/close`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchAuctions();
      }
    } catch (error) {
      console.error('Error closing auction:', error);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const filteredAuctions = auctions.filter(auction => {
    if (filterStatus === 'all') return true;
    return auction.status === filterStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Gavel className="w-8 h-8 text-orange-600" />
              Asset Auction Module
            </h1>
            <p className="text-gray-600 mt-2">
              Online auction platform for old buses and used spare parts with complete bidding lifecycle
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAuctions}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-5 h-5" />
              Create Auction
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              {auctions.filter(a => a.status === 'active').length}
            </span>
          </div>
          <div className="text-sm text-gray-600">Active Auctions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {auctions.reduce((sum, a) => sum + (a.bidCount || 0), 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total Bids</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              ₹{auctions.reduce((sum, a) => sum + (a.highestBid || 0), 0).toLocaleString()}
            </span>
          </div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">
              {auctions.filter(a => a.status === 'completed').length}
            </span>
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Auctions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAuctions.map((auction) => (
          <div key={auction._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{auction.assetName}</h3>
                <p className="text-sm text-gray-600 mt-1">{auction.assetType}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                auction.status === 'active' ? 'bg-green-100 text-green-800' :
                auction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                auction.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {auction.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Starting Bid:</span>
                <span className="font-semibold">₹{auction.startingBid?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Highest Bid:</span>
                <span className="font-semibold text-green-600">₹{auction.highestBid?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bids:</span>
                <span className="font-semibold">{auction.bidCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ends:</span>
                <span className="text-sm">{new Date(auction.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              {auction.status === 'pending' && (
                <button
                  onClick={() => approveAuction(auction._id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Approve
                </button>
              )}
              {auction.status === 'active' && (
                <button
                  onClick={() => closeAuction(auction._id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Close
                </button>
              )}
              <button
                onClick={() => setSelectedAuction(auction)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAssetAuction;
