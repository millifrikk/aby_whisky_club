/**
 * Search History Management Utility
 * Provides comprehensive search history tracking, analytics, and suggestions
 */

const STORAGE_KEYS = {
  SEARCH_HISTORY: 'aby_whisky_search_history',
  POPULAR_TERMS: 'aby_whisky_popular_terms',
  SEARCH_SETTINGS: 'aby_whisky_search_settings'
};

const DEFAULT_SETTINGS = {
  maxHistorySize: 50,
  maxSuggestions: 8,
  enableHistory: true,
  enableAnalytics: true,
  retentionDays: 30
};

/**
 * Search History Manager Class
 */
class SearchHistoryManager {
  constructor() {
    this.settings = this.loadSettings();
    this.history = this.loadHistory();
    this.popularTerms = this.loadPopularTerms();
    this._saveTimeout = null;
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Failed to load search settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SEARCH_SETTINGS, JSON.stringify(this.settings));
      return true;
    } catch (error) {
      console.error('Failed to save search settings:', error);
      return false;
    }
  }

  /**
   * Load search history from localStorage
   */
  loadHistory() {
    try {
      if (!this.settings.enableHistory) return [];
      
      const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (!saved) return [];
      
      const history = JSON.parse(saved);
      
      // Clean up old entries based on retention policy
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.settings.retentionDays);
      
      return history.filter(entry => new Date(entry.timestamp) > cutoffDate);
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Save search history to localStorage
   */
  saveHistory() {
    try {
      if (!this.settings.enableHistory) return true;
      
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(this.history));
      return true;
    } catch (error) {
      console.error('Failed to save search history:', error);
      return false;
    }
  }

  /**
   * Load popular terms analytics
   */
  loadPopularTerms() {
    try {
      if (!this.settings.enableAnalytics) return {};
      
      const saved = localStorage.getItem(STORAGE_KEYS.POPULAR_TERMS);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load popular terms:', error);
      return {};
    }
  }

  /**
   * Save popular terms analytics
   */
  savePopularTerms() {
    try {
      if (!this.settings.enableAnalytics) return true;
      
      localStorage.setItem(STORAGE_KEYS.POPULAR_TERMS, JSON.stringify(this.popularTerms));
      return true;
    } catch (error) {
      console.error('Failed to save popular terms:', error);
      return false;
    }
  }

  /**
   * Add a search term to history (optimized with debouncing)
   */
  addSearchTerm(term, results = [], searchMode = 'fuzzy') {
    if (!this.settings.enableHistory || !term.trim()) return;

    const normalizedTerm = term.trim().toLowerCase();
    
    // Skip if this is a very similar search within a short time period
    const recentEntry = this.history[0];
    if (recentEntry && recentEntry.term === normalizedTerm) {
      const timeDiff = Date.now() - new Date(recentEntry.timestamp).getTime();
      if (timeDiff < 5000) { // 5 seconds
        return; // Skip duplicate within 5 seconds
      }
    }

    const timestamp = new Date().toISOString();
    
    // Remove duplicate entries
    this.history = this.history.filter(entry => entry.term !== normalizedTerm);
    
    // Add new entry at the beginning
    this.history.unshift({
      id: Date.now() + Math.random(), // More unique ID
      term: normalizedTerm,
      originalTerm: term.trim(),
      timestamp,
      resultCount: results.length,
      searchMode,
      categories: [...new Set(results.map(r => r.category).filter(Boolean))],
      successful: results.length > 0
    });

    // Trim history to max size
    if (this.history.length > this.settings.maxHistorySize) {
      this.history = this.history.slice(0, this.settings.maxHistorySize);
    }

    // Update popular terms (with throttling)
    this.updatePopularTerms(normalizedTerm, results.length > 0);

    // Batch save to localStorage with throttling
    this.throttledSave();
  }

  /**
   * Throttled save to localStorage (reduces frequent writes)
   */
  throttledSave() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    
    this._saveTimeout = setTimeout(() => {
      this.saveHistory();
      this.savePopularTerms();
      this._saveTimeout = null;
    }, 1000); // Batch saves every 1 second
  }

  /**
   * Update popular terms analytics
   */
  updatePopularTerms(term, successful) {
    if (!this.settings.enableAnalytics) return;

    if (!this.popularTerms[term]) {
      this.popularTerms[term] = {
        count: 0,
        successCount: 0,
        lastUsed: null,
        firstUsed: new Date().toISOString()
      };
    }

    this.popularTerms[term].count++;
    if (successful) {
      this.popularTerms[term].successCount++;
    }
    this.popularTerms[term].lastUsed = new Date().toISOString();
  }

  /**
   * Get recent search history
   */
  getRecentSearches(limit = 10) {
    return this.history.slice(0, limit);
  }

  /**
   * Get popular search terms
   */
  getPopularTerms(limit = 10) {
    return Object.entries(this.popularTerms)
      .map(([term, data]) => ({
        term,
        ...data,
        successRate: data.count > 0 ? (data.successCount / data.count) : 0
      }))
      .sort((a, b) => {
        // Sort by success rate first, then by count
        if (a.successRate !== b.successRate) {
          return b.successRate - a.successRate;
        }
        return b.count - a.count;
      })
      .slice(0, limit);
  }

  /**
   * Get intelligent search suggestions
   */
  getSuggestions(currentTerm = '', limit = null) {
    const maxSuggestions = limit || this.settings.maxSuggestions;
    const suggestions = [];
    
    if (!currentTerm.trim()) {
      // Return popular terms when no current term
      const popular = this.getPopularTerms(maxSuggestions);
      return popular.map(p => ({
        term: p.term,
        type: 'popular',
        count: p.count,
        successRate: p.successRate,
        displayText: p.term,
        reason: `${p.count} searches (${Math.round(p.successRate * 100)}% success)`
      }));
    }

    const normalizedInput = currentTerm.toLowerCase();
    
    // 1. Recent searches that match current input
    const recentMatches = this.history
      .filter(entry => entry.term.includes(normalizedInput) && entry.term !== normalizedInput)
      .slice(0, Math.floor(maxSuggestions / 2))
      .map(entry => ({
        term: entry.originalTerm,
        type: 'recent',
        timestamp: entry.timestamp,
        resultCount: entry.resultCount,
        displayText: entry.originalTerm,
        reason: `Recent search (${entry.resultCount} results)`
      }));

    // 2. Popular terms that match current input
    const popularMatches = Object.entries(this.popularTerms)
      .filter(([term]) => term.includes(normalizedInput) && term !== normalizedInput)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, Math.floor(maxSuggestions / 2))
      .map(([term, data]) => ({
        term,
        type: 'popular',
        count: data.count,
        successRate: data.successCount / data.count,
        displayText: term,
        reason: `Popular (${data.count} searches)`
      }));

    // 3. Combine and deduplicate
    const allSuggestions = [...recentMatches, ...popularMatches];
    const uniqueSuggestions = allSuggestions.filter((suggestion, index) => 
      allSuggestions.findIndex(s => s.term === suggestion.term) === index
    );

    return uniqueSuggestions.slice(0, maxSuggestions);
  }

  /**
   * Get search analytics
   */
  getAnalytics() {
    const totalSearches = this.history.length;
    const successfulSearches = this.history.filter(h => h.successful).length;
    const uniqueTerms = new Set(this.history.map(h => h.term)).size;
    
    // Calculate time-based statistics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const weeklySearches = this.history.filter(h => new Date(h.timestamp) > lastWeek).length;
    const monthlySearches = this.history.filter(h => new Date(h.timestamp) > lastMonth).length;

    // Most popular categories
    const categoryStats = this.history.reduce((acc, entry) => {
      entry.categories.forEach(cat => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {});

    const topCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return {
      totalSearches,
      successfulSearches,
      successRate: totalSearches > 0 ? (successfulSearches / totalSearches) : 0,
      uniqueTerms,
      weeklySearches,
      monthlySearches,
      topCategories,
      averageResultsPerSearch: totalSearches > 0 ? 
        (this.history.reduce((sum, h) => sum + h.resultCount, 0) / totalSearches) : 0
    };
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Clear popular terms
   */
  clearPopularTerms() {
    this.popularTerms = {};
    this.savePopularTerms();
  }

  /**
   * Clear all data
   */
  clearAll() {
    this.clearHistory();
    this.clearPopularTerms();
  }

  /**
   * Remove specific search term from history
   */
  removeHistoryItem(id) {
    this.history = this.history.filter(entry => entry.id !== id);
    this.saveHistory();
  }

  /**
   * Export search data
   */
  exportData() {
    return {
      settings: this.settings,
      history: this.history,
      popularTerms: this.popularTerms,
      analytics: this.getAnalytics(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import search data
   */
  importData(data) {
    try {
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.history) {
        this.history = data.history;
        this.saveHistory();
      }
      if (data.popularTerms) {
        this.popularTerms = data.popularTerms;
        this.savePopularTerms();
      }
      return true;
    } catch (error) {
      console.error('Failed to import search data:', error);
      return false;
    }
  }
}

// Create singleton instance
const searchHistoryManager = new SearchHistoryManager();

// Export utility functions
export const searchHistory = {
  // Core functions
  addSearch: (term, results, searchMode) => searchHistoryManager.addSearchTerm(term, results, searchMode),
  getRecentSearches: (limit) => searchHistoryManager.getRecentSearches(limit),
  getPopularTerms: (limit) => searchHistoryManager.getPopularTerms(limit),
  getSuggestions: (term, limit) => searchHistoryManager.getSuggestions(term, limit),
  
  // Analytics
  getAnalytics: () => searchHistoryManager.getAnalytics(),
  
  // Management
  clearHistory: () => searchHistoryManager.clearHistory(),
  clearPopularTerms: () => searchHistoryManager.clearPopularTerms(),
  clearAll: () => searchHistoryManager.clearAll(),
  removeItem: (id) => searchHistoryManager.removeHistoryItem(id),
  
  // Settings
  getSettings: () => searchHistoryManager.settings,
  updateSettings: (settings) => searchHistoryManager.saveSettings(settings),
  
  // Data management
  exportData: () => searchHistoryManager.exportData(),
  importData: (data) => searchHistoryManager.importData(data)
};

export default searchHistory;