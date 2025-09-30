import React, { useEffect, useState } from 'react';
import errorLogger from '../utils/errorLogger';

const GoogleMapsDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [allErrors, setAllErrors] = useState({});

  useEffect(() => {
    // Update errors from error logger
    const updateErrors = () => {
      setAllErrors(errorLogger.getAllErrors());
    };

    // Update errors every second
    const interval = setInterval(updateErrors, 1000);
    updateErrors(); // Initial update

        const checkApiKey = () => {
          const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
          const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
          const hardcodedKey = 'AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk';
          const apiKey = viteKey || craKey || hardcodedKey;

      const info = {
        viteKey: viteKey ? `${viteKey.substring(0, 10)}...` : 'Not found',
        craKey: craKey ? `${craKey.substring(0, 10)}...` : 'Not found',
        hardcodedKey: hardcodedKey ? `${hardcodedKey.substring(0, 10)}...` : 'Not found',
        finalApiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found',
        hasGoogle: !!window.google,
        hasGoogleMaps: !!(window.google && window.google.maps),
        currentUrl: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50) + '...',
        timestamp: new Date().toISOString(),
        importMetaExists: typeof import.meta !== 'undefined',
        importMetaEnvExists: typeof import.meta !== 'undefined' && !!import.meta.env,
        processExists: typeof process !== 'undefined',
        processEnvExists: typeof process !== 'undefined' && !!process.env,
        allEnvVars: typeof import.meta !== 'undefined' && import.meta.env ? Object.keys(import.meta.env) : []
      };

      console.log('🔍 Google Maps Debug Info:', info);
      setDebugInfo(info);
    };

    checkApiKey();

    // Test loading Google Maps API
        if (!window.google) {
          const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
          const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
          const hardcodedKey = 'AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk';
          const apiKey = viteKey || craKey || hardcodedKey;
          
          if (apiKey) {
            console.log('🚀 Attempting to load Google Maps API...');
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
              console.log('✅ Google Maps API loaded successfully');
              checkApiKey();
            };
            script.onerror = (error) => {
              console.error('❌ Failed to load Google Maps API:', error);
              setDebugInfo(prev => ({
                ...prev,
                loadError: 'Failed to load API',
                scriptError: error.message || 'Unknown script error',
                scriptSrc: script.src
              }));
            };
            document.head.appendChild(script);
          } else {
            console.error('❌ No API key found for Google Maps');
            setDebugInfo(prev => ({ ...prev, loadError: 'No API key found' }));
          }
        }

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px', maxHeight: '600px', overflowY: 'auto' }}>
      <h3>🔍 Google Maps Debug Information</h3>
      
      {/* Environment Variables */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🔑 Environment Variables:</h4>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <p><strong>VITE_GOOGLE_MAPS_API_KEY:</strong> {debugInfo.viteKey}</p>
          <p><strong>REACT_APP_GOOGLE_MAPS_API_KEY:</strong> {debugInfo.craKey}</p>
          <p><strong>Final API Key Used:</strong> {debugInfo.finalApiKey}</p>
          <p><strong>All Environment Variables:</strong> {debugInfo.allEnvVars?.join(', ') || 'None found'}</p>
        </div>
      </div>

      {/* Google Maps Status */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🗺️ Google Maps Status:</h4>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <p><strong>window.google exists:</strong> {debugInfo.hasGoogle ? '✅ Yes' : '❌ No'}</p>
          <p><strong>window.google.maps exists:</strong> {debugInfo.hasGoogleMaps ? '✅ Yes' : '❌ No'}</p>
          <p><strong>import.meta exists:</strong> {debugInfo.importMetaExists ? '✅ Yes' : '❌ No'}</p>
          <p><strong>import.meta.env exists:</strong> {debugInfo.importMetaEnvExists ? '✅ Yes' : '❌ No'}</p>
          <p><strong>process exists:</strong> {debugInfo.processExists ? '✅ Yes' : '❌ No'}</p>
          <p><strong>process.env exists:</strong> {debugInfo.processEnvExists ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      {/* Environment Info */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🌐 Environment:</h4>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <p><strong>Current URL:</strong> {debugInfo.currentUrl}</p>
          <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
        </div>
      </div>

      {/* All Errors Summary */}
      <div style={{ marginBottom: '20px' }}>
        <h4>📊 Error Summary:</h4>
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <p><strong>Total Errors:</strong> {allErrors.summary?.totalErrors || 0}</p>
          <p><strong>Total Warnings:</strong> {allErrors.summary?.totalWarnings || 0}</p>
          <p><strong>Total Network Errors:</strong> {allErrors.summary?.totalNetworkErrors || 0}</p>
          {allErrors.summary?.lastError && (
            <p><strong>Last Error:</strong> {allErrors.summary.lastError.type} - {allErrors.summary.lastError.details?.message || 'Unknown'}</p>
          )}
        </div>
      </div>

      {/* Console Errors */}
      {allErrors.errors && allErrors.errors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>🚨 Console Errors ({allErrors.errors.length}):</h4>
          <div style={{ backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {allErrors.errors.slice(-10).map((error, index) => (
              <div key={error.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
                <strong>[{error.type}]</strong> {error.details?.message || 'Unknown error'}
                <br />
                <span style={{ color: '#666' }}>{error.timestamp}</span>
                {error.details?.stack && (
                  <details style={{ marginTop: '5px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '10px' }}>Stack Trace</summary>
                    <pre style={{ fontSize: '10px', marginTop: '5px' }}>{error.details.stack}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Errors */}
      {allErrors.networkErrors && allErrors.networkErrors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>🌐 Network Errors ({allErrors.networkErrors.length}):</h4>
          <div style={{ backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {allErrors.networkErrors.slice(-10).map((error, index) => (
              <div key={error.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
                <strong>Type:</strong> {error.type}
                <br />
                <strong>URL:</strong> {error.details?.url || 'Unknown'}
                <br />
                <strong>Error:</strong> {error.details?.error || 'Unknown error'}
                <br />
                <span style={{ color: '#666' }}>{error.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Load Errors */}
      {debugInfo.loadError && (
        <div style={{ marginBottom: '20px' }}>
          <h4>❌ Load Errors:</h4>
          <div style={{ backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
            <p><strong>Error:</strong> {debugInfo.loadError}</p>
            {debugInfo.scriptError && <p><strong>Script Error:</strong> {debugInfo.scriptError}</p>}
            {debugInfo.scriptSrc && <p><strong>Script Source:</strong> {debugInfo.scriptSrc}</p>}
          </div>
        </div>
      )}

      {/* Raw Debug Info */}
      <div style={{ marginBottom: '20px' }}>
        <h4>📋 Raw Debug Info:</h4>
        <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px', fontSize: '10px', maxHeight: '300px', overflowY: 'auto' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={() => window.location.reload()} 
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔄 Reload Page
        </button>
        <button 
          onClick={() => {
            const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
            if (viteKey) {
              const script = document.createElement('script');
              script.src = `https://maps.googleapis.com/maps/api/js?key=${viteKey}&libraries=places`;
              script.async = true;
              script.defer = true;
              script.onload = () => {
                console.log('✅ Google Maps API reloaded successfully');
                window.location.reload();
              };
              script.onerror = (error) => {
                console.error('❌ Failed to reload Google Maps API:', error);
              };
              document.head.appendChild(script);
            }
          }}
          style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🔄 Retry Google Maps
        </button>
        <button 
          onClick={() => {
            errorLogger.clearAll();
            setAllErrors({});
          }}
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗑️ Clear Errors
        </button>
      </div>
    </div>
  );
};

export default GoogleMapsDebug;
