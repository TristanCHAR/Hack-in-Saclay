import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import './GameAccessManagement.css';

interface Child {
    id: string;
    name: string;
    username: string;
}

interface GameAccess {
    child_id: string;
    game_id: string;
    enabled: boolean;
}

const AVAILABLE_GAMES = [
    { id: 'fruit-ninja', name: 'Fruit Ninja', icon: '🍎' },
    { id: 'jeu-du-bruit', name: 'Jeu du Bruit', icon: '🔊' },
];

export const GameAccessManagement: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [gameAccess, setGameAccess] = useState<GameAccess[]>([]);
    const [loading, setLoading] = useState(true);
    const { activeWorkspace } = useWorkspaceStore();

    useEffect(() => {
        if (activeWorkspace) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [activeWorkspace]);

    const loadData = async () => {
        if (!activeWorkspace) return;

        // Load children
        const { data: childrenData } = await supabase
            .from('children')
            .select('id, name, username')
            .eq('workspace_id', activeWorkspace.id);

        setChildren(childrenData || []);

        // Load game access
        const { data: accessData } = await supabase
            .from('child_game_access')
            .select('*');

        setGameAccess(accessData || []);
        setLoading(false);
    };

    const isGameEnabled = (childId: string, gameId: string): boolean => {
        const access = gameAccess.find(
            (a) => a.child_id === childId && a.game_id === gameId
        );
        // Par défaut activé si pas dans la table
        return access ? access.enabled : true;
    };

    const toggleGame = async (childId: string, gameId: string) => {
        const currentlyEnabled = isGameEnabled(childId, gameId);
        const newEnabled = !currentlyEnabled;

        // Upsert dans la DB
        const { error } = await supabase
            .from('child_game_access')
            .upsert({
                child_id: childId,
                game_id: gameId,
                enabled: newEnabled,
            }, {
                onConflict: 'child_id,game_id'
            });

        if (error) {
            console.error('Error toggling game:', error);
            return;
        }

        // Update local state
        const existingIndex = gameAccess.findIndex(
            (a) => a.child_id === childId && a.game_id === gameId
        );

        if (existingIndex >= 0) {
            const newAccess = [...gameAccess];
            newAccess[existingIndex].enabled = newEnabled;
            setGameAccess(newAccess);
        } else {
            setGameAccess([...gameAccess, { child_id: childId, game_id: gameId, enabled: newEnabled }]);
        }
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    if (children.length === 0) {
        return (
            <div className="empty-state">
                <p>Aucun enfant pour le moment</p>
                <p className="hint">Ajoutez un enfant d'abord dans "Mes Enfants"</p>
            </div>
        );
    }

    return (
        <div className="game-access-management">
            <h1>Gestion des Jeux</h1>
            <p className="subtitle">Activez ou désactivez les jeux pour chaque enfant</p>

            <div className="children-games">
                {children.map((child) => (
                    <div key={child.id} className="child-section">
                        <div className="child-header">
                            <h2>{child.name}</h2>
                            <span className="username">@{child.username}</span>
                        </div>

                        <div className="games-grid">
                            {AVAILABLE_GAMES.map((game) => {
                                const enabled = isGameEnabled(child.id, game.id);
                                return (
                                    <div
                                        key={game.id}
                                        className={`game-toggle ${enabled ? 'enabled' : 'disabled'}`}
                                        onClick={() => toggleGame(child.id, game.id)}
                                    >
                                        <span className="game-icon">{game.icon}</span>
                                        <span className="game-name">{game.name}</span>
                                        <div className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={() => { }}
                                                className="toggle-input"
                                            />
                                            <span className="toggle-slider"></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
