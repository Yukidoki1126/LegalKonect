import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Lawyer, Specialization } from '../types/lawyer';

interface LawyersContextType {
  lawyers: Lawyer[];
  specializations: Specialization[];
  setLawyers: (lawyers: Lawyer[]) => void;
  setSpecializations: (specs: Specialization[]) => void;
  isCached: boolean;
  invalidateCache: () => void;
}

const LawyersContext = createContext<LawyersContextType | undefined>(undefined);

export const LawyersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [version, setVersion] = useState(0); // bump to signal invalidation

  const handleSetLawyers = (newLawyers: Lawyer[]) => {
    setLawyers(newLawyers);
    setIsCached(true);
  };

  const handleSetSpecializations = (newSpecs: Specialization[]) => {
    setSpecializations(newSpecs);
  };

  const invalidateCache = () => {
    setIsCached(false);
    setVersion(v => v + 1);
  };

  return (
    <LawyersContext.Provider
      value={{
        lawyers,
        specializations,
        setLawyers: handleSetLawyers,
        setSpecializations: handleSetSpecializations,
        isCached,
        invalidateCache,
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