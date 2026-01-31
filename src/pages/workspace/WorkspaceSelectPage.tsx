import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import './WorkspaceSelectPage.css';

interface WorkspaceWithRole {
    id: string;
    name: string;
    invite_code: string;
    role: string;
}

export const WorkspaceSelectPage: React.FC = () => {
    const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setActiveWorkspace } = useWorkspaceStore();

    const loadWorkspaces = useCallback(async () => {
        if (!user) return;

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
            console.error('Error loading workspaces:', error);
            setLoading(false);
            return;
        }

        const formattedWorkspaces = data.map((item: any) => ({
            id: item.workspaces.id,
            name: item.workspaces.name,
            invite_code: item.workspaces.invite_code,
            role: item.role,
        }));

        setWorkspaces(formattedWorkspaces);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    const handleSelectWorkspace = (workspace: WorkspaceWithRole) => {
        setActiveWorkspace({
            id: workspace.id,
            name: workspace.name,
            invite_code: workspace.invite_code,
            role: workspace.role as any,
        });
        navigate('/app/dashboard');
    };

    const handleCreateWorkspace = async () => {
        if (!user || !newWorkspaceName.trim()) return;

        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({
                name: newWorkspaceName,
                invite_code: generateInviteCode(),
            })
            .select()
            .single();

        if (wsError) {
            console.error('Error creating workspace:', wsError);
            return;
        }

        const { error: memberError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: user.id,
                role: 'owner',
            });

        if (memberError) {
            console.error('Error adding member:', memberError);
            return;
        }

        setShowCreate(false);
        setNewWorkspaceName('');
        loadWorkspaces();
    };

    const handleJoinWorkspace = async () => {
        if (!user || !inviteCode.trim()) return;

        const { data: workspace, error: wsError } = await supabase
            .from('workspaces')
            .select('*')
            .eq('invite_code', inviteCode.trim())
            .single();

        if (wsError || !workspace) {
            alert('Code invalide');
            return;
        }

        const { error: memberError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: user.id,
                role: 'caregiver',
            });

        if (memberError) {
            console.error('Error joining workspace:', memberError);
            return;
        }

        setShowJoin(false);
        setInviteCode('');
        loadWorkspaces();
    };

    const generateInviteCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    if (loading) {
        return <div className="workspace-loading">Chargement...</div>;
    }

    return (
        <div className="workspace-select-page">
            <div className="workspace-container">
                <h1>Mes Espaces</h1>
                <p className="subtitle">Choisis un espace pour commencer</p>

                <div className="workspace-list">
                    {workspaces.map((workspace) => (
                        <div
                            key={workspace.id}
                            className="workspace-card"
                            onClick={() => handleSelectWorkspace(workspace)}
                        >
                            <h3>{workspace.name}</h3>
                            <span className="role-badge">{workspace.role}</span>
                        </div>
                    ))}
                </div>

                <div className="workspace-actions">
                    <button className="btn-primary" onClick={() => setShowCreate(true)}>
                        + Créer un espace
                    </button>
                    <button className="btn-secondary" onClick={() => setShowJoin(true)}>
                        Rejoindre un espace
                    </button>
                </div>

                {showCreate && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>Créer un espace</h2>
                            <input
                                type="text"
                                placeholder="Nom de l'espace (ex: Famille Martin)"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={handleCreateWorkspace}>
                                    Créer
                                </button>
                                <button className="btn-secondary" onClick={() => setShowCreate(false)}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showJoin && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>Rejoindre un espace</h2>
                            <input
                                type="text"
                                placeholder="Code d'invitation"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            />
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={handleJoinWorkspace}>
                                    Rejoindre
                                </button>
                                <button className="btn-secondary" onClick={() => setShowJoin(false)}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
