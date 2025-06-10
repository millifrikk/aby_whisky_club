import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DataExportPage = () => {
  const { isAdmin } = useAuth();
  const [exportOptions, setExportOptions] = useState({
    type: 'all',
    format: 'json',
    include_deleted: false
  });
  const [exporting, setExporting] = useState(false);

  const exportTypes = [
    { value: 'all', label: 'All Data', description: 'Export everything: whiskies, users, ratings, and events', icon: '📦' },
    { value: 'whiskies', label: 'Whiskies', description: 'Export whisky catalog with ratings', icon: '🥃' },
    { value: 'users', label: 'Users', description: 'Export user data (excluding passwords)', icon: '👥' },
    { value: 'ratings', label: 'Ratings', description: 'Export all whisky ratings and reviews', icon: '⭐' },
    { value: 'events', label: 'Events & News', description: 'Export news articles and events with RSVPs', icon: '📰' }
  ];

  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Create query parameters
      const params = {
        format: exportOptions.format,
        type: exportOptions.type,
        include_deleted: exportOptions.include_deleted
      };

      // Use axios directly for file download to handle response properly
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/admin/export?${new URLSearchParams(params)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export_${Date.now()}.${exportOptions.format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export data: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const getDataTypeStats = () => {
    // This would typically come from an API call, but for now we'll use placeholder data
    return {
      whiskies: 150,
      users: 45,
      ratings: 320,
      events: 25
    };
  };

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

  const stats = getDataTypeStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Export</h1>
        <p className="text-gray-600 mt-2">Export system data for backup, analysis, or migration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Configuration */}
        <div className="space-y-6">
          {/* Data Type Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Data to Export</h2>
            <div className="space-y-3">
              {exportTypes.map((type) => (
                <label key={type.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="exportType"
                    value={type.value}
                    checked={exportOptions.type === type.value}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, type: e.target.value }))}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{type.icon}</span>
                      <span className="font-medium text-gray-900">{type.label}</span>
                      {type.value !== 'all' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {stats[type.value]} items
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportOptions.format === 'json'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-gray-900">JSON</span>
                  <p className="text-sm text-gray-600">Structured data format, includes all relationships</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportOptions.format === 'csv'}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-gray-900">CSV</span>
                  <p className="text-sm text-gray-600">Spreadsheet-compatible format, flattened data</p>
                </div>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportOptions.include_deleted}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, include_deleted: e.target.checked }))}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Include Deleted Items</span>
                  <p className="text-sm text-gray-600">Include soft-deleted or inactive records</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Export Summary and Action */}
        <div className="space-y-6">
          {/* Export Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Data Type:</span>
                <span className="font-medium">
                  {exportTypes.find(t => t.value === exportOptions.type)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium uppercase">{exportOptions.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Include Deleted:</span>
                <span className="font-medium">{exportOptions.include_deleted ? 'Yes' : 'No'}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Items:</span>
                  <span className="font-medium">
                    {exportOptions.type === 'all' 
                      ? Object.values(stats).reduce((a, b) => a + b, 0)
                      : stats[exportOptions.type] || 0
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Action */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Start Export</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <div className="text-blue-400 mr-3 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Export Information</p>
                    <p className="text-blue-700 mt-1">
                      The export will include all selected data in the chosen format. 
                      Large exports may take a few moments to complete.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full bg-amber-600 text-white px-4 py-3 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {exporting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Start Export
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Recent Exports */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h2>
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No recent exports</p>
              <p className="text-sm">Export history would appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportPage;