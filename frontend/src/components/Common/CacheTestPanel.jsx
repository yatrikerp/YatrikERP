import React, { useState } from 'react';
import { clearAllCaches, clearAuthCaches, clearDataCaches } from '../../utils/cacheManager';

/**
 * Cache Test Panel - For development and testing purposes
 * This component provides buttons to test different cache clearing functions
 */
const CacheTestPanel = () => {
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const handleClearAllCaches = async () => {
    addTestResult('🧹 Starting comprehensive cache clearing...', 'info');
    try {
      const result = await clearAllCaches();
      if (result) {
        addTestResult('✅ All caches cleared successfully!', 'success');
      } else {
        addTestResult('⚠️ Cache clearing completed with some warnings', 'warning');
      }
    } catch (error) {
      addTestResult(`❌ Error clearing caches: ${error.message}`, 'error');
    }
  };

  const handleClearAuthCaches = () => {
    addTestResult('🔐 Clearing authentication caches...', 'info');
    try {
      const result = clearAuthCaches();
      if (result) {
        addTestResult('✅ Authentication caches cleared!', 'success');
      } else {
        addTestResult('⚠️ Auth cache clearing completed with warnings', 'warning');
      }
    } catch (error) {
      addTestResult(`❌ Error clearing auth caches: ${error.message}`, 'error');
    }
  };

  const handleClearDataCaches = () => {
    addTestResult('📊 Clearing data caches...', 'info');
    try {
      const result = clearDataCaches();
      if (result) {
        addTestResult('✅ Data caches cleared!', 'success');
      } else {
        addTestResult('⚠️ Data cache clearing completed with warnings', 'warning');
      }
    } catch (error) {
      addTestResult(`❌ Error clearing data caches: ${error.message}`, 'error');
    }
  };

  const handleTestLocalStorage = () => {
    addTestResult('🧪 Testing localStorage operations...', 'info');
    try {
      // Test storing data
      localStorage.setItem('test_key', 'test_value');
      localStorage.setItem('yatrik_test', 'test_data');
      
      // Test retrieving data
      const testValue = localStorage.getItem('test_key');
      const yatrikValue = localStorage.getItem('yatrik_test');
      
      if (testValue === 'test_value' && yatrikValue === 'test_data') {
        addTestResult('✅ localStorage read/write test passed', 'success');
        
        // Clean up test data
        localStorage.removeItem('test_key');
        localStorage.removeItem('yatrik_test');
        addTestResult('🧹 Test data cleaned up', 'info');
      } else {
        addTestResult('❌ localStorage test failed', 'error');
      }
    } catch (error) {
      addTestResult(`❌ localStorage test error: ${error.message}`, 'error');
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
  };

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Cache Test Panel</h3>
        <button
          onClick={handleClearResults}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear Results
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <button
          onClick={handleClearAllCaches}
          className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Clear All Caches
        </button>
        
        <button
          onClick={handleClearAuthCaches}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Clear Auth Caches
        </button>
        
        <button
          onClick={handleClearDataCaches}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Clear Data Caches
        </button>
        
        <button
          onClick={handleTestLocalStorage}
          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          Test localStorage
        </button>
      </div>

      <div className="max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No tests run yet</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-400">[{result.timestamp}]</span>{' '}
                <span className={getResultColor(result.type)}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheTestPanel;

