import React from 'react';
import { Search, Settings, ChevronRight } from 'lucide-react';

const SettingsSearchResults = ({ 
  searchResults = [], 
  searchTerm = '',
  onSettingClick,
  renderSettingControl,
  className = ""
}) => {
  // Highlight matching text in search results
  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark 
          key={index} 
          className="bg-yellow-200 px-1 rounded text-black"
        >
          {part}
        </mark>
      ) : part
    );
  };

  // Get category icon and color
  const getCategoryStyle = (category) => {
    const styles = {
      general: { icon: '⚙️', color: 'bg-gray-100 text-gray-800' },
      security: { icon: '🔒', color: 'bg-red-100 text-red-800' },
      email: { icon: '✉️', color: 'bg-blue-100 text-blue-800' },
      appearance: { icon: '🎨', color: 'bg-purple-100 text-purple-800' },
      social_features: { icon: '👥', color: 'bg-green-100 text-green-800' },
      content: { icon: '📄', color: 'bg-yellow-100 text-yellow-800' },
      features: { icon: '⭐', color: 'bg-indigo-100 text-indigo-800' },
      analytics: { icon: '📊', color: 'bg-cyan-100 text-cyan-800' },
      events: { icon: '📅', color: 'bg-orange-100 text-orange-800' },
      privacy: { icon: '🛡️', color: 'bg-pink-100 text-pink-800' },
      localization: { icon: '🌍', color: 'bg-teal-100 text-teal-800' },
      api_integration: { icon: '🔌', color: 'bg-violet-100 text-violet-800' }
    };
    
    return styles[category] || { icon: '📝', color: 'bg-gray-100 text-gray-800' };
  };

  // Group results by category for better organization
  const groupedResults = searchResults.reduce((acc, setting) => {
    const category = setting.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {});

  const categoryNames = Object.keys(groupedResults).sort();

  if (searchResults.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No settings found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Try adjusting your search terms or filters. You can search by setting name, 
          description, keywords, or category.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {categoryNames.map(categoryName => {
        const categoryStyle = getCategoryStyle(categoryName);
        const settings = groupedResults[categoryName];
        
        return (
          <div key={categoryName} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{categoryStyle.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/_/g, ' ')}
                </h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.color}`}>
                  {settings.length} setting{settings.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Settings in Category */}
            <div className="grid gap-4">
              {settings.map(setting => {
                const searchData = setting.search || {};
                const title = searchData.title || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div 
                    key={setting.key}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Setting Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {highlightText(title, searchTerm)}
                          </h4>
                          
                          {/* Weight Indicator */}
                          {searchData.weight === 'high' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Important
                            </span>
                          )}
                          
                          {onSettingClick && (
                            <button
                              onClick={() => onSettingClick(setting)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Go to setting"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Setting Description */}
                        <p className="text-sm text-gray-600 mb-3">
                          {highlightText(setting.description || 'No description available', searchTerm)}
                        </p>

                        {/* Setting Key */}
                        <div className="flex items-center space-x-2 mb-3">
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800">
                            {highlightText(setting.key, searchTerm)}
                          </code>
                          <span className="text-xs text-gray-500">
                            {setting.data_type}
                          </span>
                        </div>

                        {/* Keywords and Synonyms */}
                        {(searchData.keywords?.length > 0 || searchData.synonyms?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {searchData.keywords?.map(keyword => (
                              <span 
                                key={keyword}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                              >
                                {highlightText(keyword, searchTerm)}
                              </span>
                            ))}
                            {searchData.synonyms?.map(synonym => (
                              <span 
                                key={synonym}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700"
                              >
                                {highlightText(synonym, searchTerm)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Setting Control */}
                        {renderSettingControl && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            {renderSettingControl(setting)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Results Summary */}
      <div className="text-center pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Showing {searchResults.length} of {searchResults.length} settings
          {searchTerm && (
            <span> matching "<strong>{searchTerm}</strong>"</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SettingsSearchResults;