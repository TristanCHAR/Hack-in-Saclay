import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { createChild, updateChildPassword } from '../../lib/childAuth';
import { useParentRoute } from '../../hooks/useRouteProtection';
import './ChildrenManagement.css';

interface Child {
    id: string;
    name: string;
    username: string;
    age?: number;
}

export const ChildrenManagement: React.FC = () => {
    useParentRoute(); // Protéger contre accès enfant
    const { activeWorkspace } = useWorkspaceStore();
    const [child, setChild] = useState<Child | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        age: '',
        password: '',
        session_duration: '1', // durée en minutes (défaut 1 min)
    });

    useEffect(() => {
        if (activeWorkspace) {
            loadChild();
        }
    }, [activeWorkspace]);

    const loadChild = async () => {
        if (!activeWorkspace) return;

        setLoading(true);
        const { data } = await supabase
            .from('children')
            .select('*')
            .eq('workspace_id', activeWorkspace.id)
            .limit(1)
            .single();

        if (data) {
            setChild(data);
            setFormData({
                name: data.name,
                username: data.username,
                age: data.age?.toString() || '',
                password: '',
                session_duration: data.session_duration?.toString() || '1',
            });
        } else {
            setChild(null);
            setEditing(true); // Auto-open create form
            // Reset for new child
            setFormData({
                name: '',
                username: '',
                age: '',
                password: '',
                session_duration: '1',
            });
        }
        setLoading(false);
    };

    const handleCreateChild = async () => {
        if (!activeWorkspace || !formData.name || !formData.username || !formData.password) {
            alert('Tous les champs sont requis (sauf âge)');
            return;
        }

        try {
            // Si âge vide, on considère 0
            const ageVal = formData.age ? parseInt(formData.age) : 0;

            const newChild = await createChild({
                workspace_id: activeWorkspace.id,
                name: formData.name,
                username: formData.username,
                password: formData.password,
                // On calcule une birth_date approximative basée sur l'âge (ou 0)
                birth_date: new Date(new Date().getFullYear() - ageVal, 0, 1).toISOString(),
            });

            if (!newChild) {
                throw new Error('Échec de la création');
            }

            // Update session_duration and age separately/additionally if needed
            await supabase
                .from('children')
                .update({
                    session_duration: parseInt(formData.session_duration) || 1,
                    age: ageVal
                })
                .eq('id', newChild.id);

            setChild(newChild);
            setEditing(false);
            setFormData({ ...formData, password: '' });
            alert('Enfant créé avec succès !');
        } catch (error: any) {
            alert('Erreur : ' + error.message);
        }
    };

    const handleUpdateChild = async () => {
        if (!child || !formData.name || !formData.username) {
            alert('Nom et nom d\'utilisateur requis');
            return;
        }

        try {
            const ageVal = formData.age ? parseInt(formData.age) : 0;

            // Update basic info
            const { error } = await supabase
                .from('children')
                .update({
                    name: formData.name,
                    username: formData.username,
                    age: ageVal,
                    session_duration: parseInt(formData.session_duration) || 1,
                })
                .eq('id', child.id);

            if (error) throw error;

            // Update password if provided
            if (formData.password) {
                await updateChildPassword(child.id, formData.password);
            }

            await loadChild();
            setEditing(false);
            setFormData({ ...formData, password: '' });
            alert('Informations mises à jour !');
        } catch (error: any) {
            alert('Erreur : ' + error.message);
        }
    };

    const handleResetSession = async () => {
        if (!child) return;

        try {
            const { error } = await supabase
                .from('children')
                .update({ last_session_reset: new Date().toISOString() })
                .eq('id', child.id);

            if (error) throw error;
            alert('Session réinitialisée ! L\'enfant peut maintenant rejouer.');
        } catch (error: any) {
            alert('Erreur : ' + error.message);
        }
    };

    if (!activeWorkspace) {
        return (
            <div className="children-management">
                <div className="no-workspace">
                    <p>Veuillez sélectionner un workspace en haut</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="children-management">
                <div className="loading">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="children-management">
            <div className="header">
                <div>
                    <h1>Mon Enfant</h1>
                    <p className="subtitle">Gérer les informations de l'enfant de ce workspace</p>
                </div>
                {child && (
                    <button className="btn-secondary btn-reset" onClick={handleResetSession} style={{ marginLeft: 'auto' }}>
                        Réinitialiser la session 🔄
                    </button>
                )}
            </div>

            <div className="child-form">
                <h2>{child ? 'Modifier les informations' : 'Créer un enfant'}</h2>

                <div className="form-group">
                    <label>Nom complet</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Lucas Dupont"
                    />
                </div>

                <div className="form-group">
                    <label>Nom d'utilisateur (login)</label>
                    <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Ex: lucas"
                    />
                </div>

                <div className="form-group">
                    <label>Âge (optionnel)</label>
                    <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Ex: 8"
                    />
                </div>

                <div className="form-group">
                    <label>Durée de session (minutes)</label>
                    <input
                        type="number"
                        value={formData.session_duration}
                        onChange={(e) => setFormData({ ...formData, session_duration: e.target.value })}
                        placeholder="Ex: 15"
                        min="5"
                        max="60"
                    />
                    <small className="hint">Temps maximum par session de jeu (5-60 min)</small>
                </div>

                <div className="form-group">
                    <label>{child ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••"
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-primary" onClick={child ? handleUpdateChild : handleCreateChild}>
                        {child ? 'Enregistrer les modifications' : 'Créer le compte enfant'}
                    </button>
                </div>
            </div>
        </div>
    );
};
