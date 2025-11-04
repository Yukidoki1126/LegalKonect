import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: (key: string) => boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  loadingStates: Set<string>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());

  const isLoading = useCallback((key: string) => {
    return loadingStates.has(key);
  }, [loadingStates]);

  const startLoading = useCallback((key: string) => {
    setLoadingStates(prev => new Set(prev).add(key));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingStates }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};
