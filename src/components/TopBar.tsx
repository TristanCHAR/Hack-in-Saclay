import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useChildAuthStore } from '../stores/childAuthStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../context/SettingsContext';
import './TopBar.css';

interface WorkspaceWithRole {
    id: string;
    name: string;
    invite_code: string;
    role: string;
}

export const TopBar: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const { user } = useAuthStore(); // Modified destructuring
    const { signOut } = useAuth(); // Added useAuth hook
    const { reset: resetChild } = useChildAuthStore();
    const { activeWorkspace, setActiveWorkspace, workspaces, setWorkspaces } = useWorkspaceStore();
    const { resetSession } = useSettings();
    const navigate = useNavigate();

    // Charger les workspaces au montage ou quand l'user change
    useEffect(() => {
        const loadWorkspaces = async () => {
            if (!user) return;

            console.log("[TopBar] Loading workspaces for user:", user.id);
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    workspace_id,
                    role,
                    workspaces (
                        id,
                        name,
                        invite_code
                    )
                `)
                .eq('user_id', user.id);

            if (error) {
                console.error('[TopBar] Error loading workspaces:', error);
                return;
            }

            const formattedWorkspaces = data.map((item: any) => ({
                id: item.workspaces.id,
                name: item.workspaces.name,
                invite_code: item.workspaces.invite_code,
                role: item.role,
            }));

            console.log("[TopBar] Workspaces loaded:", formattedWorkspaces.length);
            setWorkspaces(formattedWorkspaces);
        };

        if (user) {
            loadWorkspaces();
        }
    }, [user, setWorkspaces]);

    const handleSelectWorkspace = (workspace: WorkspaceWithRole) => {
        setActiveWorkspace({
            id: workspace.id,
            name: workspace.name,
            invite_code: workspace.invite_code,
            role: workspace.role as any,
        });
        setShowDropdown(false);
    };

    const handleManageWorkspaces = () => {
        navigate('/workspaces');
        setShowDropdown(false);
    };

    const handleSignOut = async () => {
        await signOut();
        resetChild();
        resetSession();
        navigate('/auth/child/login');
    };

    return (
        <div className="top-bar">
            <div className="top-bar-content">
                <h1 className="app-title">KidoKinetics</h1>

                <div className="top-bar-actions">
                    {/* Workspace selector */}
                    <div className="workspace-selector">
                        <button
                            className="workspace-btn"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <span className="workspace-icon">📁</span>
                            <span className="workspace-name">
                                {activeWorkspace?.name || 'Sélectionner workspace'}
                            </span>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {showDropdown && (
                            <div className="workspace-dropdown">
                                <div className="dropdown-header">Mes Workspaces</div>
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        className={`workspace-option ${activeWorkspace?.id === ws.id ? 'active' : ''}`}
                                        onClick={() => handleSelectWorkspace(ws)}
                                    >
                                        <span className="ws-name">{ws.name}</span>
                                        <span className="ws-role">{ws.role}</span>
                                    </button>
                                ))}
                                <div className="dropdown-divider"></div>
                                <button
                                    className="workspace-option manage"
                                    onClick={handleManageWorkspaces}
                                >
                                    ⚙️ Gérer les workspaces
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications Bell */}
                    <button
                        className="notification-btn"
                        onClick={() => navigate('/app/notifications')}
                        title="Alertes"
                    >
                        <span className="bell-icon">🔔</span>
                        {/* On pourrait ajouter un badge ici si on fetch le count */}
                    </button>

                    {/* Sign out button */}
                    <button className="sign-out-btn" onClick={handleSignOut} title="Déconnexion">
                        🚪
                    </button>
                </div>
            </div>
        </div>
    );
};
