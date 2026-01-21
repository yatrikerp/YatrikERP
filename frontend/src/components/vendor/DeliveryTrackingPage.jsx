import React, { useState } from 'react';
import { Truck, Package, CheckCircle, Clock, AlertCircle, Plus, MapPin, Calendar, X, XCircle } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import toast from 'react-hot-toast';

const DeliveryTrackingPage = ({ purchaseOrders, onUpdate }) => {
  const [selectedPO, setSelectedPO] = useState(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    dispatchDate: '',
    transporterName: '',
    vehicleNumber: '',
    lrNumber: '',
    ewayBill: '',
    expectedArrivalDate: ''
  });

  const handleCreateDispatch = async (poId) => {
    if (!dispatchData.dispatchDate || !dispatchData.transporterName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await apiFetch(`/api/vendor/purchase-orders/${poId}/create-dispatch`, {
        method: 'POST',
        body: JSON.stringify({
          ...dispatchData,
          status: 'dispatched'
        })
      });

      if (response.ok && response.data.success) {
        toast.success('Dispatch created successfully');
        setShowDispatchModal(false);
        setDispatchData({
          dispatchDate: '',
          transporterName: '',
          vehicleNumber: '',
          lrNumber: '',
          ewayBill: '',
          expectedArrivalDate: ''
        });
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.data?.message || 'Failed to create dispatch');
      }
    } catch (error) {
      console.error('Error creating dispatch:', error);
      toast.error('Failed to create dispatch');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      dispatched: { color: 'bg-blue-100 text-blue-800', icon: Truck },
      in_transit: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      delayed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const acceptedPOs = purchaseOrders.filter(po => po.status === 'accepted' || po.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Tracking (Execution Phase)</h2>
        
        {acceptedPOs.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No accepted purchase orders to track</p>
            <p className="text-sm text-gray-400 mt-2">Accept purchase orders first to create dispatches</p>
          </div>
        ) : (
          <div className="space-y-4">
            {acceptedPOs.map((po) => (
              <div key={po._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{po.poNumber}</h3>
                      {getStatusBadge(po.deliveryStatus?.status || 'pending')}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Depot:</span>
                        <p className="font-medium">{po.depotName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Order Date:</span>
                        <p className="font-medium">{new Date(po.orderDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected Delivery:</span>
                        <p className="font-medium">
                          {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Amount:</span>
                        <p className="font-medium">₹{po.totalAmount?.toLocaleString('en-IN') || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispatch Information */}
                {po.deliveryStatus?.status && po.deliveryStatus.status !== 'pending' ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Dispatch Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {po.deliveryStatus.dispatchDate && (
                        <div>
                          <span className="text-gray-500">Dispatch Date:</span>
                          <p className="font-medium">{new Date(po.deliveryStatus.dispatchDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {po.deliveryStatus.transporterName && (
                        <div>
                          <span className="text-gray-500">Transporter:</span>
                          <p className="font-medium">{po.deliveryStatus.transporterName}</p>
                        </div>
                      )}
                      {po.deliveryStatus.vehicleNumber && (
                        <div>
                          <span className="text-gray-500">Vehicle No:</span>
                          <p className="font-medium">{po.deliveryStatus.vehicleNumber}</p>
                        </div>
                      )}
                      {po.deliveryStatus.lrNumber && (
                        <div>
                          <span className="text-gray-500">LR Number:</span>
                          <p className="font-medium">{po.deliveryStatus.lrNumber}</p>
                        </div>
                      )}
                      {po.deliveryStatus.ewayBill && (
                        <div>
                          <span className="text-gray-500">E-Way Bill:</span>
                          <p className="font-medium">{po.deliveryStatus.ewayBill}</p>
                        </div>
                      )}
                      {po.deliveryStatus.expectedArrivalDate && (
                        <div>
                          <span className="text-gray-500">Expected Arrival:</span>
                          <p className="font-medium">{new Date(po.deliveryStatus.expectedArrivalDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setShowDispatchModal(true);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create Dispatch
                  </button>
                )}

                {/* GRN Status */}
                {po.grnStatus && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">GRN Status</h4>
                    <div className="flex items-center gap-2">
                      {po.grnStatus === 'approved' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 font-medium">GRN Approved</span>
                        </>
                      ) : po.grnStatus === 'rejected' ? (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700 font-medium">GRN Rejected / Partial</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="text-yellow-700 font-medium">Pending GRN</span>
                        </>
                      )}
                    </div>
                    {po.grnRemarks && (
                      <p className="text-xs text-gray-600 mt-1">{po.grnRemarks}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dispatch Modal */}
      {showDispatchModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Dispatch - {selectedPO.poNumber}</h2>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setSelectedPO(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dispatch Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dispatchData.dispatchDate}
                  onChange={(e) => setDispatchData({ ...dispatchData, dispatchDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transporter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dispatchData.transporterName}
                  onChange={(e) => setDispatchData({ ...dispatchData, transporterName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={dispatchData.vehicleNumber}
                    onChange={(e) => setDispatchData({ ...dispatchData, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LR Number
                  </label>
                  <input
                    type="text"
                    value={dispatchData.lrNumber}
                    onChange={(e) => setDispatchData({ ...dispatchData, lrNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Way Bill
                </label>
                <input
                  type="text"
                  value={dispatchData.ewayBill}
                  onChange={(e) => setDispatchData({ ...dispatchData, ewayBill: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Arrival Date
                </label>
                <input
                  type="date"
                  value={dispatchData.expectedArrivalDate}
                  onChange={(e) => setDispatchData({ ...dispatchData, expectedArrivalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDispatchModal(false);
                    setSelectedPO(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateDispatch(selectedPO._id)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTrackingPage;
