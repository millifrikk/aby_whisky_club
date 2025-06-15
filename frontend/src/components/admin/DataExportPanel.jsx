import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, User, Shield, Archive, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DataExportPanel = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [exportFormat, setExportFormat] = useState('zip');
  const [includePersonalData, setIncludePersonalData] = useState(true);
  const [includeActivityData, setIncludeActivityData] = useState(true);
  const [includeContentData, setIncludeContentData] = useState(true);

  // Fetch export history on component mount
  useEffect(() => {
    fetchExportHistory();
  }, []);

  const fetchExportHistory = async () => {
    try {
      // This would be implemented in the backend
      // const response = await adminAPI.getExportHistory();
      // setExportHistory(response.data);
      
      // Mock data for now
      setExportHistory([
        {
          id: 1,
          user_email: 'user@example.com',
          export_type: 'full_data',
          format: 'zip',
          status: 'completed',
          created_at: '2025-06-14T10:30:00Z',
          download_url: '/exports/user_data_123.zip',
          file_size: '2.4 MB'
        },
        {
          id: 2,
          user_email: 'admin@example.com',
          export_type: 'activity_only',
          format: 'json',
          status: 'processing',
          created_at: '2025-06-14T09:15:00Z',
          file_size: null
        }
      ]);
    } catch (error) {
      console.error('Error fetching export history:', error);
      toast.error('Failed to load export history');
    }
  };

  const handleExportRequest = async () => {
    if (!selectedUser.trim()) {
      toast.error('Please enter a user email address');
      return;
    }

    try {
      setLoading(true);
      
      const exportData = {
        user_email: selectedUser,
        format: exportFormat,
        include_personal: includePersonalData,
        include_activity: includeActivityData,
        include_content: includeContentData
      };

      // This would call the backend GDPR export API
      // const response = await adminAPI.createDataExport(exportData);
      
      // Mock success for now
      toast.success('Data export request created successfully');
      
      // Add to history with processing status
      const newExport = {
        id: Date.now(),
        user_email: selectedUser,
        export_type: 'custom',
        format: exportFormat,
        status: 'processing',
        created_at: new Date().toISOString(),
        file_size: null
      };
      
      setExportHistory(prev => [newExport, ...prev]);
      
      // Reset form
      setSelectedUser('');
      
    } catch (error) {
      console.error('Error creating export:', error);
      toast.error('Failed to create data export');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (exportItem) => {
    if (exportItem.download_url) {
      // In real implementation, this would download from the server
      toast.success('Download started');
    } else {
      toast.error('Export file not ready for download');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const isExportEnabled = settings?.export_user_data_enabled !== false;

  if (!isExportEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Data Export Disabled</h3>
          <p className="text-gray-600 dark:text-gray-400">
            User data export functionality is currently disabled. Enable it in the API Integration settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Export Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">GDPR compliance and user data portability</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4 mr-1" />
            GDPR Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Request Form */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Create Data Export</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="zip">ZIP Archive (Recommended)</option>
                <option value="json">JSON Format</option>
                <option value="csv">CSV Format</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Data to Include
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includePersonalData}
                    onChange={(e) => setIncludePersonalData(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Personal Information (Profile, Settings)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeActivityData}
                    onChange={(e) => setIncludeActivityData(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Activity Data (Login History, Analytics)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeContentData}
                    onChange={(e) => setIncludeContentData(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Content Data (Ratings, Reviews, Whiskies)
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleExportRequest}
              disabled={loading || !selectedUser.trim()}
              className={`
                w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors
                ${loading || !selectedUser.trim()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              `}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Create Export
            </button>
          </div>
        </div>

        {/* Export History */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Recent Exports</h4>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {exportHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No exports yet</p>
              </div>
            ) : (
              exportHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.user_email}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="uppercase font-medium">{item.format}</span>
                      {item.file_size && (
                        <span>{item.file_size}</span>
                      )}
                    </div>
                    
                    {item.status === 'completed' && (
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex items-center px-2 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GDPR Information */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">GDPR Compliance Information</h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Data exports include all personal data associated with the user account</li>
          <li>• Exports are generated in machine-readable formats for data portability</li>
          <li>• Export files are automatically deleted after 7 days for security</li>
          <li>• All export requests are logged for compliance auditing</li>
          <li>• Users can request their own data through their profile settings</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExportPanel;