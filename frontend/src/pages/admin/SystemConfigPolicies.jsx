import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  DollarSign,
  Calendar,
  Gavel,
  CheckCircle
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from 'react-hot-toast';

const SystemConfigPolicies = () => {
  const [config, setConfig] = useState({
    concessionRules: {
      schoolDiscount: 50,
      collegeDiscount: 50,
      seniorCitizenDiscount: 50,
      distanceCap: 100,
      validityPeriod: 365
    },
    schedulingConstraints: {
      maxDriverHours: 10,
      minRestHours: 8,
      maxConsecutiveDays: 6
    },
    auctionRules: {
      minBidAmount: 100,
      biddingDuration: 24,
      autoApproveThreshold: 10000
    },
    paymentThresholds: {
      autoApprovalLimit: 10000,
      manualApprovalLimit: 50000
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/system-config');

      if (res.ok) {
        setConfig(res.data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiFetch('/api/admin/system-config', {
        method: 'PUT',
        body: JSON.stringify(config),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        toast.success('System configuration saved successfully');
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ConfigSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Icon className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const ConfigField = ({ label, value, onChange, type = 'number', min, max, unit }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          min={min}
          max={max}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {unit && <span className="text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Configuration & Policies</h1>
          <p className="text-gray-600">Manage system-wide settings and policies</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchConfig}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Concession Rules */}
      <ConfigSection title="Concession Rules" icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="School Discount (%)"
            value={config.concessionRules?.schoolDiscount || 50}
            onChange={(value) => updateConfig('concessionRules', 'schoolDiscount', value)}
            min={0}
            max={100}
            unit="%"
          />
          <ConfigField
            label="College Discount (%)"
            value={config.concessionRules?.collegeDiscount || 50}
            onChange={(value) => updateConfig('concessionRules', 'collegeDiscount', value)}
            min={0}
            max={100}
            unit="%"
          />
          <ConfigField
            label="Senior Citizen Discount (%)"
            value={config.concessionRules?.seniorCitizenDiscount || 50}
            onChange={(value) => updateConfig('concessionRules', 'seniorCitizenDiscount', value)}
            min={0}
            max={100}
            unit="%"
          />
          <ConfigField
            label="Distance Cap (km)"
            value={config.concessionRules?.distanceCap || 100}
            onChange={(value) => updateConfig('concessionRules', 'distanceCap', value)}
            min={0}
            unit="km"
          />
          <ConfigField
            label="Validity Period (days)"
            value={config.concessionRules?.validityPeriod || 365}
            onChange={(value) => updateConfig('concessionRules', 'validityPeriod', value)}
            min={1}
            unit="days"
          />
        </div>
      </ConfigSection>

      {/* Scheduling Constraints */}
      <ConfigSection title="Scheduling Constraints" icon={Calendar}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigField
            label="Max Driver Hours"
            value={config.schedulingConstraints?.maxDriverHours || 10}
            onChange={(value) => updateConfig('schedulingConstraints', 'maxDriverHours', value)}
            min={1}
            max={24}
            unit="hours"
          />
          <ConfigField
            label="Min Rest Hours"
            value={config.schedulingConstraints?.minRestHours || 8}
            onChange={(value) => updateConfig('schedulingConstraints', 'minRestHours', value)}
            min={1}
            max={24}
            unit="hours"
          />
          <ConfigField
            label="Max Consecutive Days"
            value={config.schedulingConstraints?.maxConsecutiveDays || 6}
            onChange={(value) => updateConfig('schedulingConstraints', 'maxConsecutiveDays', value)}
            min={1}
            max={14}
            unit="days"
          />
        </div>
      </ConfigSection>

      {/* Auction Rules */}
      <ConfigSection title="Auction Rules" icon={Gavel}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ConfigField
            label="Min Bid Amount"
            value={config.auctionRules?.minBidAmount || 100}
            onChange={(value) => updateConfig('auctionRules', 'minBidAmount', value)}
            min={0}
            unit="₹"
          />
          <ConfigField
            label="Bidding Duration"
            value={config.auctionRules?.biddingDuration || 24}
            onChange={(value) => updateConfig('auctionRules', 'biddingDuration', value)}
            min={1}
            unit="hours"
          />
          <ConfigField
            label="Auto Approve Threshold"
            value={config.auctionRules?.autoApproveThreshold || 10000}
            onChange={(value) => updateConfig('auctionRules', 'autoApproveThreshold', value)}
            min={0}
            unit="₹"
          />
        </div>
      </ConfigSection>

      {/* Payment Thresholds */}
      <ConfigSection title="Payment Thresholds" icon={DollarSign}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ConfigField
            label="Auto Approval Limit"
            value={config.paymentThresholds?.autoApprovalLimit || 10000}
            onChange={(value) => updateConfig('paymentThresholds', 'autoApprovalLimit', value)}
            min={0}
            unit="₹"
          />
          <ConfigField
            label="Manual Approval Limit"
            value={config.paymentThresholds?.manualApprovalLimit || 50000}
            onChange={(value) => updateConfig('paymentThresholds', 'manualApprovalLimit', value)}
            min={0}
            unit="₹"
          />
        </div>
      </ConfigSection>
    </div>
  );
};

export default SystemConfigPolicies;
