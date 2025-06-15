import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, XCircle, AlertTriangle, Clock, Filter, Search } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ContentModerationPanel = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [autoModerationStats, setAutoModerationStats] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize data on component mount
  useEffect(() => {
    fetchModerationData();
  }, [selectedFilter]);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      
      // Mock data for moderation queue
      const mockQueue = [
        {
          id: 1,
          type: 'review',
          content: 'This whisky is absolutely amazing! Best I\'ve ever tasted.',
          user: 'whisky_lover_23',
          whisky_name: 'Macallan 18',
          status: 'pending',
          auto_approval_score: 0.92,
          flagged_reasons: [],
          created_at: '2025-06-14T10:30:00Z'
        },
        {
          id: 2,
          type: 'rating',
          content: 'Overall rating: 4.5/5 with detailed scores',
          user: 'connoisseur_45',
          whisky_name: 'Lagavulin 16',
          status: 'pending',
          auto_approval_score: 0.88,
          flagged_reasons: [],
          created_at: '2025-06-14T09:15:00Z'
        },
        {
          id: 3,
          type: 'review',
          content: 'Contains inappropriate language and spam content',
          user: 'suspicious_user',
          whisky_name: 'Glenfiddich 12',
          status: 'flagged',
          auto_approval_score: 0.23,
          flagged_reasons: ['inappropriate_language', 'spam_detection'],
          created_at: '2025-06-14T08:45:00Z'
        }
      ];

      // Filter by status
      const filteredQueue = selectedFilter === 'all' 
        ? mockQueue 
        : mockQueue.filter(item => item.status === selectedFilter);

      setModerationQueue(filteredQueue);
      
      // Mock auto-moderation stats
      setAutoModerationStats({
        total_processed: 1247,
        auto_approved: 1089,
        flagged_for_review: 158,
        approval_rate: 87.3,
        avg_processing_time: '0.3s'
      });
      
    } catch (error) {
      console.error('Error fetching moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleModerateContent = async (itemId, action) => {
    try {
      // Mock API call
      // await adminAPI.moderateContent(itemId, action);
      
      // Update local state
      setModerationQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
          : item
      ));
      
      toast.success(`Content ${action}d successfully`);
    } catch (error) {
      console.error('Error moderating content:', error);
      toast.error(`Failed to ${action} content`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isContentModerationEnabled = settings?.enable_content_moderation !== false;

  if (!isContentModerationEnabled) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Content Moderation Disabled</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Content moderation features are currently disabled. Enable them in the security settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredQueue = moderationQueue.filter(item =>
    searchTerm === '' || 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.whisky_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 theme-transition">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Moderation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Review and moderate user-generated content</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-sm font-medium">
            <Eye className="h-4 w-4 mr-1" />
            {filteredQueue.length} Items
          </span>
        </div>
      </div>

      {/* Auto-Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Processed</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{autoModerationStats.total_processed}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400">Auto Approved</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{autoModerationStats.auto_approved}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Flagged</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{autoModerationStats.flagged_for_review}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400">Approval Rate</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{autoModerationStats.approval_rate}%</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-sm text-purple-600 dark:text-purple-400">Avg Time</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{autoModerationStats.avg_processing_time}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Items</option>
            <option value="pending">Pending Review</option>
            <option value="flagged">Flagged Content</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content, users, or whiskies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No content to moderate</p>
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">{item.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      by {item.user} • {item.whisky_name}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">AI Score</div>
                    <div className={`text-sm font-medium ${getScoreColor(item.auto_approval_score)}`}>
                      {(item.auto_approval_score * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  {item.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleModerateContent(item.id, 'approve')}
                        className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerateContent(item.id, 'reject')}
                        className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-gray-800 dark:text-gray-200 text-sm bg-white dark:bg-gray-800 p-3 rounded border">
                  "{item.content}"
                </p>
              </div>
              
              {item.flagged_reasons.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Flagged: {item.flagged_reasons.join(', ').replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Usage Information */}
      <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <h5 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Auto-Moderation Features</h5>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
          <li>• AI-powered content analysis for automatic approval</li>
          <li>• Spam detection and inappropriate language filtering</li>
          <li>• User reputation scoring and trust levels</li>
          <li>• Manual review queue for flagged content</li>
          <li>• Configurable approval thresholds and rules</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentModerationPanel;