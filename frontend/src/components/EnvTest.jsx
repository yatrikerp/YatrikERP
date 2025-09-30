import React from 'react';

const EnvTest = () => {
  const viteKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || '';
  const craKey = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) || '';
  const hardcodedKey = 'AIzaSyAsAkznA2sJF0pp4iAq5H2uqP9FIATjdbk';
  const finalKey = viteKey || craKey || hardcodedKey;
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px', borderRadius: '8px' }}>
      <h3>🔧 Environment Variables Test</h3>
      <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
        <p><strong>import.meta exists:</strong> {typeof import.meta !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
        <p><strong>import.meta.env exists:</strong> {typeof import.meta !== 'undefined' && import.meta.env ? '✅ Yes' : '❌ No'}</p>
        <p><strong>VITE_GOOGLE_MAPS_API_KEY:</strong> {viteKey ? `${viteKey.substring(0, 10)}...` : '❌ Not found'}</p>
        <p><strong>process exists:</strong> {typeof process !== 'undefined' ? '✅ Yes' : '❌ No'}</p>
        <p><strong>process.env exists:</strong> {typeof process !== 'undefined' && process.env ? '✅ Yes' : '❌ No'}</p>
        <p><strong>REACT_APP_GOOGLE_MAPS_API_KEY:</strong> {craKey ? `${craKey.substring(0, 10)}...` : '❌ Not found'}</p>
        <p><strong>Hardcoded API Key:</strong> {hardcodedKey ? `${hardcodedKey.substring(0, 10)}...` : '❌ Not found'}</p>
        <p><strong>Final API Key Used:</strong> {finalKey ? `${finalKey.substring(0, 10)}...` : '❌ Not found'}</p>
        <p><strong>All import.meta.env keys:</strong> {typeof import.meta !== 'undefined' && import.meta.env ? Object.keys(import.meta.env).join(', ') : 'None'}</p>
      </div>
    </div>
  );
};

export default EnvTest;
