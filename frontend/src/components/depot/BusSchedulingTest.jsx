import React, { useState, useEffect } from 'react';

const BusSchedulingTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testAPIEndpoints = async () => {
    setLoading(true);
    const results = {};
    const token = localStorage.getItem('depotToken') || localStorage.getItem('token');

    try {
      // Test Routes API
      try {
        const routesResponse = await fetch('/api/depot/routes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const routesData = await routesResponse.json();
        results.routes = {
          status: routesResponse.ok ? 'success' : 'error',
          data: routesData,
          count: routesData.success ? routesData.data.routes.length : 0
        };
      } catch (error) {
        results.routes = { status: 'error', error: error.message };
      }

      // Test Buses API
      try {
        const busesResponse = await fetch('/api/depot/buses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const busesData = await busesResponse.json();
        results.buses = {
          status: busesResponse.ok ? 'success' : 'error',
          data: busesData,
          count: busesData.success ? busesData.data.buses.length : 0
        };
      } catch (error) {
        results.buses = { status: 'error', error: error.message };
      }

      // Test Drivers API
      try {
        const driversResponse = await fetch('/api/depot/drivers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const driversData = await driversResponse.json();
        results.drivers = {
          status: driversResponse.ok ? 'success' : 'error',
          data: driversData,
          count: driversData.success ? driversData.data.drivers.length : 0
        };
      } catch (error) {
        results.drivers = { status: 'error', error: error.message };
      }

      // Test Conductors API
      try {
        const conductorsResponse = await fetch('/api/depot/conductors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const conductorsData = await conductorsResponse.json();
        results.conductors = {
          status: conductorsResponse.ok ? 'success' : 'error',
          data: conductorsData,
          count: conductorsData.success ? conductorsData.data.conductors.length : 0
        };
      } catch (error) {
        results.conductors = { status: 'error', error: error.message };
      }

      // Test Trips API
      try {
        const tripsResponse = await fetch('/api/depot/trips', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tripsData = await tripsResponse.json();
        results.trips = {
          status: tripsResponse.ok ? 'success' : 'error',
          data: tripsData,
          count: tripsData.success ? tripsData.data.trips.length : 0
        };
      } catch (error) {
        results.trips = { status: 'error', error: error.message };
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setLoading(false);
      setTestResults(results);
    }
  };

  useEffect(() => {
    testAPIEndpoints();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Bus Scheduling API Test</h2>
      <button 
        onClick={testAPIEndpoints} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          marginBottom: '20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test APIs'}
      </button>

      <div style={{ display: 'grid', gap: '16px' }}>
        {Object.entries(testResults).map(([endpoint, result]) => (
          <div 
            key={endpoint}
            style={{ 
              padding: '16px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              backgroundColor: result.status === 'success' ? '#f0f9ff' : '#fef2f2'
            }}
          >
            <h3 style={{ 
              margin: '0 0 8px 0', 
              color: result.status === 'success' ? '#059669' : '#dc2626' 
            }}>
              {endpoint.toUpperCase()} API
            </h3>
            <p style={{ margin: '0 0 8px 0' }}>
              Status: <strong>{result.status}</strong>
            </p>
            {result.count !== undefined && (
              <p style={{ margin: '0 0 8px 0' }}>
                Count: <strong>{result.count}</strong>
              </p>
            )}
            {result.error && (
              <p style={{ margin: '0', color: '#dc2626' }}>
                Error: {result.error}
              </p>
            )}
            {result.data && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  View Response Data
                </summary>
                <pre style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {Object.keys(testResults).length === 0 && !loading && (
        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '40px' }}>
          Click "Test APIs" to check if all endpoints are working correctly.
        </p>
      )}
    </div>
  );
};

export default BusSchedulingTest;
