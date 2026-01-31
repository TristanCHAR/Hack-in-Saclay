import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface SettingsContextType {
    sessionDuration: number;
    setSessionDuration: (duration: number) => void;
    sessionStartTime: number | null;
    startSession: () => void;
    resetSession: () => void;
    isSessionActive: boolean;
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
            isSessionActive
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
