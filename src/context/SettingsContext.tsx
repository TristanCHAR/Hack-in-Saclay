import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface MedicationLog {
  id: string;
  name: string;
  timestamp: number;
}

export interface SeizureLog {
  id: string;
  timestamp: number;
  duration?: number; // en secondes
  notes?: string;
}

interface SettingsContextType {
  sessionDuration: number;
  setSessionDuration: (duration: number) => void;
  sessionStartTime: number | null;
  startSession: () => void;
  resetSession: () => void;
  isSessionActive: boolean;
  medications: MedicationLog[];
  addMedication: (name: string) => void;
  seizures: SeizureLog[];
  addSeizure: (notes?: string, duration?: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionDuration, setSessionDuration] = useState<number>(() => {
    const saved = localStorage.getItem('sessionDuration');
    return saved ? Math.max(60, parseInt(saved, 10)) : 60;
  });

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('sessionStartTime');
    return saved ? parseInt(saved, 10) : null;
  });

  const [medications, setMedications] = useState<MedicationLog[]>(() => {
    const saved = localStorage.getItem('medications');
    return saved ? JSON.parse(saved) : [];
  });

  const [seizures, setSeizures] = useState<SeizureLog[]>(() => {
    const saved = localStorage.getItem('seizures');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sessionDuration', sessionDuration.toString());
  }, [sessionDuration]);

  useEffect(() => {
    localStorage.setItem('medications', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('seizures', JSON.stringify(seizures));
  }, [seizures]);

  const startSession = () => {
    if (!sessionStartTime) {
      const now = Date.now();
      setSessionStartTime(now);
      sessionStorage.setItem('sessionStartTime', now.toString());
    }
  };

  const resetSession = () => {
    setSessionStartTime(null);
    sessionStorage.removeItem('sessionStartTime');
  };

  const addMedication = (name: string) => {
    const newLog: MedicationLog = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
    };
    setMedications(prev => [newLog, ...prev]);
  };

  const addSeizure = (notes?: string, duration?: number) => {
    const newLog: SeizureLog = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      notes,
      duration,
    };
    setSeizures(prev => [newLog, ...prev]);
  };

  const isSessionActive = useMemo(() => {
    if (!sessionStartTime) return true;
    const elapsed = (Date.now() - sessionStartTime) / 1000;
    return elapsed < sessionDuration;
  }, [sessionStartTime, sessionDuration]);

  return (
    <SettingsContext.Provider value={{
      sessionDuration,
      setSessionDuration,
      sessionStartTime,
      startSession,
      resetSession,
      isSessionActive,
      medications,
      addMedication,
      seizures,
      addSeizure
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
