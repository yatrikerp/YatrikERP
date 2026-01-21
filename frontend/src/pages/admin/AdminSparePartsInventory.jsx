import React, { useState, useEffect } from 'react';
import { 
  Package, 
  QrCode, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Brain,
  TrendingUp
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

const AdminSparePartsInventory = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const [mlPredictions, setMlPredictions] = useState(null);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/spare-parts');
      if (res.ok) {
        setParts(res.data.parts || []);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMLPredictions = async () => {
    try {
      const res = await apiFetch('/api/ai/analytics/predictions', {
        method: 'POST',
        body: JSON.stringify({ type: 'maintenance' })
      });
      if (res.ok) {
        setMlPredictions(res.data);
      }
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    }
  };

  useEffect(() => {
    fetchParts();
    fetchMLPredictions();
  }, []);

  const generateQRCode = async (partId) => {
    try {
      const res = await apiFetch(`/api/spare-parts/${partId}/qr-code`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchParts();
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         part.partNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || part.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Spare Parts & Inventory Management
            </h1>
            <p className="text-gray-600 mt-2">
              Complete digitization with QR tags, AI-based maintenance prediction, and auto-reorder
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchParts}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Part
            </button>
          </div>
        </div>
      </div>

      {/* ML Maintenance Predictions */}
      {mlPredictions && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI-Based Maintenance Predictions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Parts Needing Reorder</div>
              <div className="text-2xl font-bold text-orange-600">
                {mlPredictions.reorderSuggestions?.length || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Maintenance Due Soon</div>
              <div className="text-2xl font-bold text-red-600">
                {mlPredictions.maintenanceDue?.length || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600">Optimization Potential</div>
              <div className="text-2xl font-bold text-green-600">
                {mlPredictions.optimizationPotential || 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="maintenance">In Maintenance</option>
          </select>
        </div>
      </div>

      {/* Parts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">QR Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredParts.map((part) => (
                <tr key={part._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{part.partNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{part.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{part.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{part.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      part.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                      part.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                      part.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {part.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {part.qrCode ? (
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-600">Generated</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateQRCode(part._id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Generate QR
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedPart(part)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSparePartsInventory;
