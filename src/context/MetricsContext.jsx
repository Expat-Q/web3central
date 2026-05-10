import React, { createContext, useState, useContext, useCallback } from 'react';

const MetricsContext = createContext();

export const MetricsProvider = ({ children }) => {
  const [clickCounts, setClickCounts] = useState({});
  const [selectedChain, setSelectedChain] = useState('All');

  const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

  const incrementClick = useCallback(async (toolId, initialCount) => {
    // Immediate UI feedback: update local state
    setClickCounts((prev) => {
      const current = prev[toolId] !== undefined ? prev[toolId] : initialCount;
      return {
        ...prev,
        [toolId]: current + 1,
      };
    });

    // Send to backend
    try {
      const res = await fetch(`${API}/tools/${toolId}/click`, { method: 'POST' });
      const result = await res.json();
      if (result.success && result.clickCount !== undefined) {
        // Sync with backend response just in case
        setClickCounts((prev) => ({
          ...prev,
          [toolId]: result.clickCount,
        }));
      }
    } catch (err) {
      console.error('Failed to increment click count:', err);
    }
  }, [API]);

  return (
    <MetricsContext.Provider value={{ clickCounts, incrementClick, selectedChain, setSelectedChain }}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
};
