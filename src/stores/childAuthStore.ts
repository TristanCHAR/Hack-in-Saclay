import { create } from 'zustand';
import type { ChildWithWorkspace } from '../lib/childAuth';

interface ChildAuthStore {
    child: ChildWithWorkspace | null;
    loading: boolean;
    setChild: (child: ChildWithWorkspace | null) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

// Charger depuis localStorage au démarrage
const loadChildFromStorage = (): ChildWithWorkspace | null => {
    try {
        const stored = localStorage.getItem('childAuth');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const useChildAuthStore = create<ChildAuthStore>((set) => ({
    child: loadChildFromStorage(),
    loading: false,

    setChild: (child) => {
        // Sauvegarder dans localStorage
        if (child) {
            localStorage.setItem('childAuth', JSON.stringify(child));
        } else {
            localStorage.removeItem('childAuth');
        }
        set({ child, loading: false });
    },

    setLoading: (loading) => set({ loading }),

    reset: () => {
        localStorage.removeItem('childAuth');
        set({ child: null, loading: false });
    },
}));
