import React, { createContext, useContext, useState, useCallback } from 'react';
import { comparisonAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useContentSettings } from '../hooks/useContentSettings';
import toast from 'react-hot-toast';

const ComparisonContext = createContext();

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};

export const ComparisonProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { enableWhiskyComparison } = useContentSettings();
  const [selectedWhiskies, setSelectedWhiskies] = useState([]);
  const [comparisonSessions, setComparisonSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Load user's comparison sessions
  const loadSessions = useCallback(async (options = {}) => {
    if (!isAuthenticated || !user?.id || !enableWhiskyComparison) {
      return;
    }

    try {
      setLoading(true);
      const response = await comparisonAPI.getUserSessions(user.id, options);
      setComparisonSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading comparison sessions:', error);
      toast.error('Failed to load comparison sessions');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated, enableWhiskyComparison]);

  // Add whisky to comparison selection
  const addToComparison = useCallback((whisky) => {
    if (!enableWhiskyComparison) {
      toast.error('Comparison feature is currently disabled');
      return false;
    }

    if (selectedWhiskies.length >= 10) {
      toast.error('Maximum 10 whiskies can be compared at once');
      return false;
    }

    if (selectedWhiskies.some(w => w.id === whisky.id)) {
      toast.error('This whisky is already selected for comparison');
      return false;
    }

    setSelectedWhiskies(prev => [...prev, whisky]);
    toast.success(`${whisky.name} added to comparison`);
    return true;
  }, [selectedWhiskies, enableWhiskyComparison]);

  // Remove whisky from comparison selection
  const removeFromComparison = useCallback((whiskyId) => {
    setSelectedWhiskies(prev => prev.filter(w => w.id !== whiskyId));
    return true;
  }, []);

  // Clear all selected whiskies
  const clearComparison = useCallback(() => {
    setSelectedWhiskies([]);
  }, []);

  // Check if whisky is selected for comparison
  const isInComparison = useCallback((whiskyId) => {
    return selectedWhiskies.some(w => w.id === whiskyId);
  }, [selectedWhiskies]);

  // Toggle whisky in comparison selection
  const toggleComparison = useCallback((whisky) => {
    if (isInComparison(whisky.id)) {
      removeFromComparison(whisky.id);
      return false;
    } else {
      return addToComparison(whisky);
    }
  }, [isInComparison, removeFromComparison, addToComparison]);

  // Compare selected whiskies (without saving as session)
  const compareWhiskies = useCallback(async (whiskyIds = null) => {
    const idsToCompare = whiskyIds || selectedWhiskies.map(w => w.id);

    if (!enableWhiskyComparison) {
      toast.error('Comparison feature is currently disabled');
      return null;
    }

    if (idsToCompare.length < 2) {
      toast.error('At least 2 whiskies are required for comparison');
      return null;
    }

    try {
      setComparing(true);
      const response = await comparisonAPI.compareWhiskies(idsToCompare);
      return response.data;
    } catch (error) {
      console.error('Error comparing whiskies:', error);
      toast.error('Failed to compare whiskies');
      return null;
    } finally {
      setComparing(false);
    }
  }, [selectedWhiskies, enableWhiskyComparison]);

  // Save comparison as a session
  const saveComparisonSession = useCallback(async (name, whiskyIds = null) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save comparison sessions');
      return false;
    }

    const idsToSave = whiskyIds || selectedWhiskies.map(w => w.id);

    if (idsToSave.length < 2) {
      toast.error('At least 2 whiskies are required to save a comparison');
      return false;
    }

    try {
      const response = await comparisonAPI.createSession({
        whisky_ids: idsToSave,
        name: name || `Comparison ${new Date().toLocaleDateString()}`
      });

      toast.success('Comparison session saved');
      await loadSessions(); // Reload sessions
      return response.data.session;
    } catch (error) {
      console.error('Error saving comparison session:', error);
      toast.error('Failed to save comparison session');
      return false;
    }
  }, [isAuthenticated, selectedWhiskies, loadSessions]);

  // Load a saved comparison session
  const loadSession = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      const response = await comparisonAPI.getSession(sessionId);
      const session = response.data.session;
      
      if (session.whiskies) {
        setSelectedWhiskies(session.whiskies);
      }
      
      return session;
    } catch (error) {
      console.error('Error loading comparison session:', error);
      toast.error('Failed to load comparison session');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a comparison session
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await comparisonAPI.deleteSession(sessionId);
      toast.success('Comparison session deleted');
      
      // Remove from local state
      setComparisonSessions(prev => prev.filter(s => s.id !== sessionId));
      return true;
    } catch (error) {
      console.error('Error deleting comparison session:', error);
      toast.error('Failed to delete comparison session');
      return false;
    }
  }, []);

  // Update a comparison session
  const updateSession = useCallback(async (sessionId, updates) => {
    try {
      const response = await comparisonAPI.updateSession(sessionId, updates);
      toast.success('Comparison session updated');
      
      // Update local state
      setComparisonSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, ...updates }
          : s
      ));
      
      return response.data.session;
    } catch (error) {
      console.error('Error updating comparison session:', error);
      toast.error('Failed to update comparison session');
      return false;
    }
  }, []);

  const value = {
    // State
    selectedWhiskies,
    comparisonSessions,
    loading,
    comparing,
    isEnabled: enableWhiskyComparison,
    
    // Selection Actions
    addToComparison,
    removeFromComparison,
    clearComparison,
    toggleComparison,
    
    // Comparison Actions
    compareWhiskies,
    
    // Session Actions
    loadSessions,
    saveComparisonSession,
    loadSession,
    deleteSession,
    updateSession,
    
    // Utilities
    isInComparison,
    
    // Computed
    selectionCount: selectedWhiskies.length,
    canCompare: selectedWhiskies.length >= 2,
    maxSelectionReached: selectedWhiskies.length >= 10,
    sessionsCount: comparisonSessions.length
  };

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
};