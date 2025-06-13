import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '../contexts/ComparisonContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ComparisonButton from '../components/common/ComparisonButton';

const ComparisonPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { 
    selectedWhiskies,
    isEnabled,
    compareWhiskies,
    clearComparison,
    canCompare,
    selectionCount
  } = useComparison();
  
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (canCompare) {
      handleCompare();
    }
  }, [selectedWhiskies]);

  const handleCompare = async () => {
    if (!canCompare) return;

    setLoading(true);
    try {
      const data = await compareWhiskies();
      setComparisonData(data);
    } catch (error) {
      console.error('Error comparing whiskies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to compare whiskies.</p>
          <Link
            to="/login"
            className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Unavailable</h2>
          <p className="text-gray-600">The whisky comparison feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Whisky Comparison</h1>
          <p className="mt-2 text-gray-600">
            Compare selected whiskies side by side ({selectionCount} selected)
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <Link
              to="/whiskies"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Browse Whiskies
            </Link>
            {selectionCount > 0 && (
              <button
                onClick={clearComparison}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {selectionCount === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No whiskies selected</h3>
            <p className="text-gray-600 mb-6">
              Select at least 2 whiskies from the collection to compare them.
            </p>
            <Link
              to="/whiskies"
              className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
            >
              Browse Whiskies
            </Link>
          </div>
        ) : selectionCount === 1 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select one more whisky</h3>
            <p className="text-gray-600 mb-6">
              You need at least 2 whiskies to start a comparison.
            </p>
            <div className="mb-6">
              <WhiskyCard whisky={selectedWhiskies[0]} showRemove />
            </div>
            <Link
              to="/whiskies"
              className="bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
            >
              Add More Whiskies
            </Link>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
              </div>
            ) : comparisonData ? (
              <ComparisonTable data={comparisonData} />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

const WhiskyCard = ({ whisky, showRemove = false }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 inline-block">
      <h4 className="font-medium text-gray-900">{whisky.name}</h4>
      <p className="text-sm text-gray-600">{whisky.distillery}</p>
      {showRemove && (
        <div className="mt-2">
          <ComparisonButton whisky={whisky} variant="icon" size="sm" />
        </div>
      )}
    </div>
  );
};

const ComparisonTable = ({ data }) => {
  const { whiskies, metadata } = data;

  const comparisonFields = [
    { key: 'name', label: 'Name' },
    { key: 'distillery', label: 'Distillery' },
    { key: 'region', label: 'Region' },
    { key: 'country', label: 'Country' },
    { key: 'type', label: 'Type' },
    { key: 'age', label: 'Age (years)' },
    { key: 'abv', label: 'ABV (%)' },
    { key: 'rating_average', label: 'Average Rating' },
    { key: 'rating_count', label: 'Number of Ratings' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparison Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Age Range:</span> {metadata.age_range.min}-{metadata.age_range.max} years
          </div>
          <div>
            <span className="font-medium">ABV Range:</span> {metadata.abv_range.min}-{metadata.abv_range.max}%
          </div>
          <div>
            <span className="font-medium">Regions:</span> {metadata.regions.join(', ')}
          </div>
          <div>
            <span className="font-medium">Countries:</span> {metadata.countries.join(', ')}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field
              </th>
              {whiskies.map((whisky) => (
                <th
                  key={whisky.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <Link
                    to={`/whiskies/${whisky.id}`}
                    className="hover:text-amber-600 transition-colors"
                  >
                    {whisky.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparisonFields.map((field) => (
              <tr key={field.key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {field.label}
                </td>
                {whiskies.map((whisky) => (
                  <td key={whisky.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {field.key === 'type' && whisky[field.key] 
                      ? whisky[field.key].replace('_', ' ')
                      : whisky[field.key] || 'N/A'
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Comparing {whiskies.length} whiskies
          </p>
          <div className="flex space-x-4">
            <Link
              to="/whiskies"
              className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 transition-colors"
            >
              Add More Whiskies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;