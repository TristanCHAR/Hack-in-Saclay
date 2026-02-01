import { create } from 'zustand';

interface Workspace {
    id: string;
    name: string;
    invite_code: string;
    role: 'owner' | 'parent' | 'caregiver' | 'neurologist';
}

interface Child {
    id: string;
    workspace_id: string;
    name: string;
    birth_date: string;
    avatar_config: any;
    epilepsy_profile: any | null;
}

interface WorkspaceStore {
    activeWorkspace: Workspace | null;
    workspaces: Workspace[];
    children: Child[];
    activeChild: Child | null;
    setActiveWorkspace: (workspace: Workspace | null) => void;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setChildren: (children: Child[]) => void;
    setActiveChild: (child: Child | null) => void;
    reset: () => void;
}

const loadActiveWorkspaceFromStorage = (): Workspace | null => {
    try {
        const stored = localStorage.getItem('activeWorkspace');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
    activeWorkspace: loadActiveWorkspaceFromStorage(),
    workspaces: [],
    children: [],
    activeChild: null,

    setActiveWorkspace: (workspace) => {
        if (workspace) {
            localStorage.setItem('activeWorkspace', JSON.stringify(workspace));
        } else {
            localStorage.removeItem('activeWorkspace');
        }
        set({ activeWorkspace: workspace });
    },

    setWorkspaces: (workspaces) => set({ workspaces }),
    setChildren: (children) => set({ children }),
    setActiveChild: (child) => set({ activeChild: child }),
    reset: () => {
        localStorage.removeItem('activeWorkspace');
        set({
            activeWorkspace: null,
            workspaces: [],
            children: [],
            activeChild: null
        });
    },
}));
