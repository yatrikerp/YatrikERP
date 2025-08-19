import React from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CancellationPolicyPanel = () => {
  const navigate = useNavigate();

  const handleRequestCancellation = () => {
    navigate('/pax#manage');
  };

  const policies = [
    {
      time: 'Before 24 hours',
      status: 'Full refund',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      color: 'text-green-600'
    },
    {
      time: '6-24 hours before',
      status: '50% refund',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      color: 'text-yellow-600'
    },
    {
      time: '2-6 hours before',
      status: '25% refund',
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      color: 'text-orange-600'
    },
    {
      time: 'Less than 2 hours',
      status: 'No refund',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Clock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Cancellation Policy</h2>
          <p className="text-gray-600">Understand our refund and cancellation terms</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Important Notice</h4>
              <p className="text-sm text-blue-700">
                Cancellation requests must be made before the scheduled departure time. 
                Refunds are processed within 5-7 business days.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {policies.map((policy, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {policy.icon}
                <div>
                  <p className="font-medium text-gray-900">{policy.time}</p>
                  <p className={`text-sm font-medium ${policy.color}`}>{policy.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="font-medium text-gray-900 mb-3">Need to cancel a booking?</h3>
        <p className="text-gray-600 mb-4">
          Use our booking management system to cancel your ticket and request a refund.
        </p>
        <button
          onClick={handleRequestCancellation}
          className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2"
        >
          <Clock className="w-5 h-5" />
          Request Cancellation
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Cancellation fees may apply based on payment method</li>
          <li>• Group bookings have different cancellation terms</li>
          <li>• Force majeure events may affect refund policies</li>
          <li>• Contact support for special circumstances</li>
        </ul>
      </div>
    </div>
  );
};

export default CancellationPolicyPanel;
