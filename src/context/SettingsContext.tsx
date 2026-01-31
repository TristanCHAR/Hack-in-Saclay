import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface MedicationLog {
  id: string;
  name: string;
  created_at: string;
}

export interface SeizureLog {
  id: string;
  duration: number;
  created_at: string;
}

interface SettingsContextType {
  sessionDuration: number;
  setSessionDuration: (duration: number) => void;
  sessionStartTime: number | null;
  startSession: () => void;
  resetSession: () => void;
  isSessionActive: boolean;
  medications: MedicationLog[];
  addMedication: (name: string) => Promise<void>;
  seizures: SeizureLog[];
  addSeizure: (duration: number) => Promise<void>;
  refreshData: () => Promise<void>;
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

  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [seizures, setSeizures] = useState<SeizureLog[]>([]);

  const refreshData = async () => {
    try {
      const [meds, seiz] = await Promise.all([
        api.getDrugs(),
        api.getCrises()
      ]);
      setMedications(meds);
      setSeizures(seiz);
    } catch (err) {
      console.error("Erreur refresh API:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sessionDuration', sessionDuration.toString());
  }, [sessionDuration]);

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

  const addMedication = async (name: string) => {
    try {
      await api.createDrug(name);
      await refreshData();
    } catch (err) {
      console.error("Erreur add med API:", err);
    }
  };

  const addSeizure = async (duration: number) => {
    try {
      await api.createCrise(duration);
      await refreshData();
    } catch (err) {
      console.error("Erreur add seizure API:", err);
    }
  };

  const computeActive = useCallback(() => {
    if (!sessionStartTime) return true;
    const elapsed = (Date.now() - sessionStartTime) / 1000;
    return elapsed < sessionDuration;
  }, [sessionStartTime, sessionDuration]);

  const [isSessionActive, setIsSessionActive] = useState(computeActive);

  // Re-évalue chaque seconde tant qu'une session tourne
  useEffect(() => {
    setIsSessionActive(computeActive());
    if (!sessionStartTime) return;
    const id = setInterval(() => {
      setIsSessionActive(computeActive());
    }, 1000);
    return () => clearInterval(id);
  }, [computeActive, sessionStartTime]);

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
      addSeizure,
      refreshData
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
