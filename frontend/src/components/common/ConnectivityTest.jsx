import React, { useState, useEffect } from 'react';
import { healthAPI } from '../../services/api';

const ConnectivityTest = () => {
  const [status, setStatus] = useState('testing');
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const response = await healthAPI.check();
      setApiResponse(response.data);
      setStatus('success');
    } catch (error) {
      console.error('API connection failed:', error);
      setApiResponse({ error: error.message });
      setStatus('error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">API Connectivity Test</h3>
      
      <div className="flex items-center mb-4">
        <span className="mr-2">Status:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {status === 'testing' ? 'Testing...' :
           status === 'success' ? 'Connected' :
           'Failed'}
        </span>
      </div>

      {apiResponse && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">API Response:</h4>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={testConnection}
        className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
      >
        Test Again
      </button>
    </div>
  );
};

export default ConnectivityTest;
