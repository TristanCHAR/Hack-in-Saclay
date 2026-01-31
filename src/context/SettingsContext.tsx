import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useChildAuthStore } from '../stores/childAuthStore';

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
    const saved = localStorage.getItem('sessionStartTime');
    return saved ? parseInt(saved, 10) : null;
  });

  const [medications, setMedications] = useState<MedicationLog[]>([]);
  const [seizures, setSeizures] = useState<SeizureLog[]>([]);

  const { child } = useChildAuthStore();

  const [isSessionActive, setIsSessionActive] = useState(true);

  const startSession = useCallback(() => {
    const now = Date.now();
    console.log("[Settings] >>> STARTING PERSISTENT SESSION AT:", new Date(now).toLocaleTimeString());
    setSessionStartTime(now);
    localStorage.setItem('sessionStartTime', now.toString());
    setIsSessionActive(true);
  }, []);

  const resetSession = useCallback(() => {
    console.log("[Settings] >>> RESETTING PERSISTENT SESSION");
    setSessionStartTime(null);
    localStorage.removeItem('sessionStartTime');
    setIsSessionActive(true);
  }, []);

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

  // Charger session_duration et check reset depuis la DB
  useEffect(() => {
    const loadChildSettings = async () => {
      if (!child?.id) return;

      try {
        const { supabase } = await import('../lib/supabase');
        const { data, error } = await supabase
          .from('children')
          .select('session_duration, last_session_reset')
          .eq('id', child.id)
          .single();

        if (error) throw error;

        // 1. Durée
        const durationMin = data?.session_duration || 15;
        setSessionDuration(durationMin * 60);

        // 2. Reset distant
        if (data?.last_session_reset && sessionStartTime) {
          const remoteReset = new Date(data.last_session_reset).getTime();
          if (remoteReset > sessionStartTime) {
            console.log("[Settings] Parent reset detected! Clearing local session.");
            resetSession();
          }
        }
      } catch (err) {
        console.error("[Settings] Erreur loadChildSettings:", err);
      }
    };

    loadChildSettings();
    refreshData();

    // Polling léger pour le reset (toutes les 10s)
    const id = setInterval(loadChildSettings, 10000);
    return () => clearInterval(id);
  }, [child?.id, sessionStartTime, resetSession]);

  useEffect(() => {
    if (sessionDuration > 0) {
      localStorage.setItem('sessionDuration', sessionDuration.toString());
    }
  }, [sessionDuration]);

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

  // Sync isSessionActive with timer
  useEffect(() => {
    const id = setInterval(() => {
      if (!sessionStartTime) {
        setIsSessionActive(true);
        return;
      }

      const elapsed = (Date.now() - sessionStartTime) / 1000;
      const remaining = sessionDuration - elapsed;

      if (remaining <= 0) {
        if (isSessionActive) {
          console.log("[Settings] !!! SESSION EXPIRED !!!");
          setIsSessionActive(false);
        }
      } else {
        if (!isSessionActive) setIsSessionActive(true);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [sessionStartTime, sessionDuration, isSessionActive]);

  // Si on se déconnecte, on reset la session
  useEffect(() => {
    if (!child) {
      resetSession();
    }
  }, [child, resetSession]);

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
