import React, { useState, useEffect } from 'react';
import { whiskyAPI } from '../../services/api';

const ApiDebugger = () => {
  const [featuredWhiskies, setFeaturedWhiskies] = useState(null);
  const [stats, setStats] = useState(null);
  const [allWhiskies, setAllWhiskies] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testAllEndpoints = async () => {
    try {
      console.log('🧪 Testing API endpoints...');
      
      // Test featured whiskies
      try {
        const featuredRes = await whiskyAPI.getFeatured();
        console.log('✅ Featured whiskies response:', featuredRes.data);
        setFeaturedWhiskies(featuredRes.data);
      } catch (error) {
        console.error('❌ Featured whiskies error:', error);
        setErrors(prev => ({ ...prev, featured: error.message }));
      }

      // Test stats
      try {
        const statsRes = await whiskyAPI.getStats();
        console.log('✅ Stats response:', statsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('❌ Stats error:', error);
        setErrors(prev => ({ ...prev, stats: error.message }));
      }

      // Test all whiskies
      try {
        const allRes = await whiskyAPI.getAll();
        console.log('✅ All whiskies response:', allRes.data);
        setAllWhiskies(allRes.data);
      } catch (error) {
        console.error('❌ All whiskies error:', error);
        setErrors(prev => ({ ...prev, all: error.message }));
      }

      // Test debug endpoint
      try {
        const debugRes = await fetch('http://localhost:3001/api/whiskies/debug');
        const debugData = await debugRes.json();
        console.log('🔧 Debug endpoint response:', debugData);
        setErrors(prev => ({ ...prev, debug: debugRes.ok ? 'SUCCESS' : debugData.error }));
      } catch (error) {
        console.error('❌ Debug endpoint error:', error);
        setErrors(prev => ({ ...prev, debug: error.message }));
      }

    } catch (error) {
      console.error('❌ General error:', error);
      setErrors(prev => ({ ...prev, general: error.message }));
    } finally {
      setLoading(false);
    }
  };

  const retryTest = () => {
    setLoading(true);
    setErrors({});
    setFeaturedWhiskies(null);
    setStats(null);
    setAllWhiskies(null);
    testAllEndpoints();
  };

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🧪 API Debugging Tool</h3>
        <p>Testing API endpoints...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">🧪 API Debugging Results</h3>
        <button
          onClick={retryTest}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          Retry Tests
        </button>
      </div>

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="font-medium text-red-800 mb-2">❌ Errors:</h4>
          {Object.entries(errors).map(([key, error]) => (
            <div key={key} className="text-sm text-red-700">
              <strong>{key}:</strong> {error}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="font-medium mb-2">📊 Stats API:</h4>
        {stats ? (
          <pre className="text-sm text-gray-700 overflow-x-auto">
            {JSON.stringify(stats, null, 2)}
          </pre>
        ) : (
          <p className="text-gray-500">No stats data</p>
        )}
      </div>

      {/* Featured Whiskies */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="font-medium mb-2">⭐ Featured Whiskies API:</h4>
        {featuredWhiskies ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Count: {featuredWhiskies.whiskies?.length || 0}
            </p>
            <pre className="text-sm text-gray-700 overflow-x-auto max-h-60">
              {JSON.stringify(featuredWhiskies, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500">No featured whiskies data</p>
        )}
      </div>

      {/* All Whiskies */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="font-medium mb-2">🥃 All Whiskies API:</h4>
        {allWhiskies ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Count: {allWhiskies.whiskies?.length || 0} / 
              Total: {allWhiskies.pagination?.total_count || 0}
            </p>
            <pre className="text-sm text-gray-700 overflow-x-auto max-h-40">
              {JSON.stringify(allWhiskies.whiskies?.slice(0, 2), null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500">No whiskies data</p>
        )}
      </div>

      <div className="text-xs text-gray-500 pt-4 border-t">
        Check your browser console (F12) for more detailed logs.
      </div>
    </div>
  );
};

export default ApiDebugger;
