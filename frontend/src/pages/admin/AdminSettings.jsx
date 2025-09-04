import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Shield, 
  Database, 
  Mail, 
  Bell, 
  Globe, 
  Smartphone,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Server,
  Zap,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Route,
  Bus,
  Calendar,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  Edit3
} from 'lucide-react';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Yatrik ERP',
      siteDescription: 'Advanced Bus Management System',
      timezone: 'Asia/Kolkata',
      language: 'en',
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
    },
    security: {
      passwordMinLength: 8,
      passwordRequireSpecial: true,
      sessionTimeout: 30,
      twoFactorEnabled: false,
      loginAttempts: 5,
      lockoutDuration: 15,
      ipWhitelist: [],
      encryptionLevel: 'AES-256'
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      adminAlerts: true,
      systemAlerts: true,
      bookingAlerts: true,
      maintenanceAlerts: true
    },
    api: {
      rateLimit: 1000,
      corsEnabled: true,
      allowedOrigins: ['http://localhost:3000'],
      apiVersion: 'v1',
      debugMode: false,
      logLevel: 'info'
    },
    database: {
      connectionPool: 10,
      queryTimeout: 30,
      backupEnabled: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      compressionEnabled: true
    },
    payment: {
      gatewayEnabled: true,
      testMode: false,
      merchantId: '',
      secretKey: '',
      webhookUrl: '',
      autoRefund: false,
      refundWindow: 24
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  const tabs = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'api', label: 'API Settings', icon: Globe },
    { key: 'database', label: 'Database', icon: Database },
    { key: 'payment', label: 'Payments', icon: DollarSign }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const resetToDefaults = (category) => {
    if (window.confirm(`Reset ${category} settings to default values?`)) {
      // Reset logic would go here
      alert(`${category} settings reset to defaults`);
    }
  };

  const testConnection = async (type) => {
    try {
      const response = await fetch(`/api/admin/test/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        alert(`${type} connection test successful!`);
      } else {
        alert(`${type} connection test failed!`);
      }
    } catch (error) {
      alert(`${type} connection test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchSettings}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings Categories</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                        activeTab === tab.key
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <TabIcon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Basic system configuration and preferences</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                      <select
                        value={settings.general.dateFormat}
                        onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <textarea
                      value={settings.general.siteDescription}
                      onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure authentication and security policies</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
                      <input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="6"
                        max="20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="5"
                        max="480"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        value={settings.security.loginAttempts}
                        onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="3"
                        max="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                      <input
                        type="number"
                        value={settings.security.lockoutDuration}
                        onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Require Special Characters</h4>
                        <p className="text-xs text-gray-500">Passwords must include special characters</p>
                      </div>
                      <button
                        onClick={() => updateSetting('security', 'passwordRequireSpecial', !settings.security.passwordRequireSpecial)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.security.passwordRequireSpecial ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.passwordRequireSpecial ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-500">Enable 2FA for all admin users</p>
                      </div>
                      <button
                        onClick={() => updateSetting('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.security.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure system notifications and alerts</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'emailEnabled', label: 'Email Notifications', description: 'Send notifications via email' },
                      { key: 'smsEnabled', label: 'SMS Notifications', description: 'Send notifications via SMS' },
                      { key: 'pushEnabled', label: 'Push Notifications', description: 'Send browser push notifications' },
                      { key: 'adminAlerts', label: 'Admin Alerts', description: 'Receive administrative alerts' },
                      { key: 'systemAlerts', label: 'System Alerts', description: 'Receive system health alerts' },
                      { key: 'bookingAlerts', label: 'Booking Alerts', description: 'Receive booking-related alerts' },
                      { key: 'maintenanceAlerts', label: 'Maintenance Alerts', description: 'Receive maintenance notifications' }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', item.key, !settings.notifications[item.key])}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Settings */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure API settings and security</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (requests/hour)</label>
                      <input
                        type="number"
                        value={settings.api.rateLimit}
                        onChange={(e) => updateSetting('api', 'rateLimit', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                      <select
                        value={settings.api.logLevel}
                        onChange={(e) => updateSetting('api', 'logLevel', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="error">Error</option>
                        <option value="warn">Warning</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">CORS Enabled</h4>
                        <p className="text-xs text-gray-500">Allow cross-origin requests</p>
                      </div>
                      <button
                        onClick={() => updateSetting('api', 'corsEnabled', !settings.api.corsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.api.corsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.api.corsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Debug Mode</h4>
                        <p className="text-xs text-gray-500">Enable detailed API logging</p>
                      </div>
                      <button
                        onClick={() => updateSetting('api', 'debugMode', !settings.api.debugMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.api.debugMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.api.debugMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => testConnection('api')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Test API Connection
                    </button>
                  </div>
                </div>
              )}

              {/* Database Settings */}
              {activeTab === 'database' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Database Configuration</h3>
                    <p className="text-sm text-gray-600 mt-1">Database connection and backup settings</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Connection Pool Size</label>
                      <input
                        type="number"
                        value={settings.database.connectionPool}
                        onChange={(e) => updateSetting('database', 'connectionPool', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Query Timeout (seconds)</label>
                      <input
                        type="number"
                        value={settings.database.queryTimeout}
                        onChange={(e) => updateSetting('database', 'queryTimeout', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="5"
                        max="120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                      <select
                        value={settings.database.backupFrequency}
                        onChange={(e) => updateSetting('database', 'backupFrequency', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Retention Days</label>
                      <input
                        type="number"
                        value={settings.database.retentionDays}
                        onChange={(e) => updateSetting('database', 'retentionDays', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="7"
                        max="365"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Backup Enabled</h4>
                        <p className="text-xs text-gray-500">Automatic database backups</p>
                      </div>
                      <button
                        onClick={() => updateSetting('database', 'backupEnabled', !settings.database.backupEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.database.backupEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.database.backupEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Compression</h4>
                        <p className="text-xs text-gray-500">Enable backup compression</p>
                      </div>
                      <button
                        onClick={() => updateSetting('database', 'compressionEnabled', !settings.database.compressionEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.database.compressionEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.database.compressionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => testConnection('database')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Test Connection
                    </button>
                    <button
                      onClick={() => testConnection('backup')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Test Backup
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Gateway Settings</h3>
                    <p className="text-sm text-gray-600 mt-1">Configure payment processing and gateway settings</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                      <div className="relative">
                        <input
                          type={showSecrets ? "text" : "password"}
                          value={settings.payment.merchantId}
                          onChange={(e) => updateSetting('payment', 'merchantId', e.target.value)}
                          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter merchant ID"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(!showSecrets)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showSecrets ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Refund Window (hours)</label>
                      <input
                        type="number"
                        value={settings.payment.refundWindow}
                        onChange={(e) => updateSetting('payment', 'refundWindow', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="168"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Gateway Enabled</h4>
                        <p className="text-xs text-gray-500">Enable payment processing</p>
                      </div>
                      <button
                        onClick={() => updateSetting('payment', 'gatewayEnabled', !settings.payment.gatewayEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.payment.gatewayEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.payment.gatewayEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Test Mode</h4>
                        <p className="text-xs text-yellow-600">Use sandbox environment for testing</p>
                      </div>
                      <button
                        onClick={() => updateSetting('payment', 'testMode', !settings.payment.testMode)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.payment.testMode ? 'bg-yellow-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.payment.testMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => testConnection('payment')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Test Payment Gateway
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => resetToDefaults(activeTab)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reset to Defaults
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchSettings}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
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

export default AdminSettings;
