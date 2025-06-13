import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';

const PendingWhiskiesPage = () => {
  const { t } = useTranslation();
  const [whiskies, setWhiskies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchPendingWhiskies();
  }, [currentPage]);

  const fetchPendingWhiskies = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingWhiskies({
        page: currentPage,
        limit: 20
      });
      
      setWhiskies(response.whiskies || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Error fetching pending whiskies:', error);
      toast.error('Failed to load pending whiskies');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (whiskyId, notes = '') => {
    if (processingIds.has(whiskyId)) return;

    try {
      setProcessingIds(prev => new Set([...prev, whiskyId]));
      
      await adminAPI.approveWhisky(whiskyId, { notes });
      
      toast.success('Whisky approved successfully');
      
      // Remove from pending list
      setWhiskies(prev => prev.filter(w => w.id !== whiskyId));
      
    } catch (error) {
      console.error('Error approving whisky:', error);
      toast.error('Failed to approve whisky');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(whiskyId);
        return newSet;
      });
    }
  };

  const handleReject = async (whiskyId, notes = '') => {
    if (processingIds.has(whiskyId)) return;

    try {
      setProcessingIds(prev => new Set([...prev, whiskyId]));
      
      await adminAPI.rejectWhisky(whiskyId, { notes });
      
      toast.success('Whisky rejected');
      
      // Remove from pending list
      setWhiskies(prev => prev.filter(w => w.id !== whiskyId));
      
    } catch (error) {
      console.error('Error rejecting whisky:', error);
      toast.error('Failed to reject whisky');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(whiskyId);
        return newSet;
      });
    }
  };

  const WhiskyCard = ({ whisky }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const isProcessing = processingIds.has(whisky.id);

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {whisky.name}
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Distillery:</strong> {whisky.distillery || 'Not specified'}</p>
              <p><strong>Region:</strong> {whisky.region || 'Not specified'}</p>
              <p><strong>Country:</strong> {whisky.country || 'Not specified'}</p>
              <p><strong>Type:</strong> {whisky.type?.replace('_', ' ') || 'Not specified'}</p>
              {whisky.age && <p><strong>Age:</strong> {whisky.age} years</p>}
              {whisky.abv && <p><strong>ABV:</strong> {whisky.abv}%</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Approval
            </span>
          </div>
        </div>

        {whisky.description && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
            <p className="text-sm text-gray-600">{whisky.description}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs text-gray-500">
            Submitted on {new Date(whisky.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <div className="flex space-x-3">
            <button
              onClick={() => handleApprove(whisky.id, notes)}
              disabled={isProcessing}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Approve'
              )}
            </button>
            
            <button
              onClick={() => handleReject(whisky.id, notes)}
              disabled={isProcessing}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </button>
          </div>

          {/* Notes Section */}
          <div>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              {showNotes ? 'Hide' : 'Add'} approval notes
            </button>
            
            {showNotes && (
              <div className="mt-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for approval/rejection..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Whiskies</h1>
          <p className="mt-2 text-gray-600">
            Review and approve whisky submissions from members
          </p>
          {pagination.total_count > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {pagination.total_count} whisky{pagination.total_count !== 1 ? 'ies' : ''} pending approval
            </p>
          )}
        </div>

        {/* Content */}
        {whiskies.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending whiskies</h3>
            <p className="mt-1 text-sm text-gray-500">
              All whisky submissions have been reviewed.
            </p>
          </div>
        ) : (
          <>
            {/* Whisky Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {whiskies.map((whisky) => (
                <WhiskyCard key={whisky.id} whisky={whisky} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={!pagination.has_previous}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(pagination.total_pages, page + 1))}
                    disabled={!pagination.has_next}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                      <span className="font-medium">{pagination.total_pages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={!pagination.has_previous}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(page => Math.min(pagination.total_pages, page + 1))}
                        disabled={!pagination.has_next}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PendingWhiskiesPage;