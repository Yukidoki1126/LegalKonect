import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Lawyer, Specialization } from '../types/lawyer';

interface LawyersContextType {
  lawyers: Lawyer[];
  specializations: Specialization[];
  setLawyers: (lawyers: Lawyer[]) => void;
  setSpecializations: (specs: Specialization[]) => void;
  isCached: boolean;
  clearCache: () => void;
  lastFetched: number | null;
}

const LawyersContext = createContext<LawyersContextType | undefined>(undefined);

// Cache expires after 30 seconds for real-time availability updates
const CACHE_DURATION = 30 * 1000;

export const LawyersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  // Check if cache is still valid
  const isCached = lastFetched !== null && (Date.now() - lastFetched) < CACHE_DURATION;

  const handleSetLawyers = (newLawyers: Lawyer[]) => {
    setLawyers(newLawyers);
    setLastFetched(Date.now());
  };

  const handleSetSpecializations = (newSpecs: Specialization[]) => {
    setSpecializations(newSpecs);
  };

  const clearCache = () => {
    setLastFetched(null);
  };

  return (
    <LawyersContext.Provider
      value={{
        lawyers,
        specializations,
        setLawyers: handleSetLawyers,
        setSpecializations: handleSetSpecializations,
        isCached,
        clearCache,
        lastFetched,
      }}
    >
      {children}
    </LawyersContext.Provider>
  );
};

export const useLawyers = () => {
  const context = useContext(LawyersContext);
  if (!context) {
    throw new Error('useLawyers must be used within LawyersProvider');
  }
  return context;
};