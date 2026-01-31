import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useChildAuthStore } from '../../stores/childAuthStore';
import './ChildGamesPage.css';

interface Game {
    id: string;
    name: string;
    icon: string;
    description: string;
    route: string;
}

const ALL_GAMES: Game[] = [
    {
        id: 'fruit-ninja',
        name: 'Flash Pop',
        icon: '💥',
        description: 'Coupe les fruits !',
        route: '/child/jeux/fruit-ninja',
    },
    {
        id: 'jeu-du-bruit',
        name: 'Jeu du Bruit',
        icon: '🔊',
        description: 'Écoute et réponds !',
        route: '/child/jeux/jeu-du-bruit',
    },
];

export const ChildGamesPage: React.FC = () => {
    const [enabledGames, setEnabledGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const { child } = useChildAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        loadEnabledGames();
    }, [child]);

    const loadEnabledGames = async () => {
        if (!child) {
            setLoading(false);
            return;
        }

        // Query child_game_access
        const { data: accessData } = await supabase
            .from('child_game_access')
            .select('game_id, enabled')
            .eq('child_id', child.id);

        // Filter games
        const enabled = ALL_GAMES.filter((game) => {
            const access = accessData?.find((a) => a.game_id === game.id);
            // Si pas dans la table, activé par défaut
            return access ? access.enabled : true;
        });

        setEnabledGames(enabled);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="child-games-loading">
                <div className="loading-spinner">🎮</div>
                <p>Chargement des jeux...</p>
            </div>
        );
    }

    return (
        <div className="child-games-page">
            <div className="child-games-header">
                <h1>Bonjour {child?.name} ! 👋</h1>
                <p className="subtitle">Choisis un jeu pour commencer</p>
            </div>

            {enabledGames.length === 0 ? (
                <div className="no-games">
                    <div className="no-games-icon">😢</div>
                    <p>Aucun jeu disponible pour le moment</p>
                    <p className="hint">Demande à tes parents d'activer des jeux !</p>
                </div>
            ) : (
                <div className="games-grid">
                    {enabledGames.map((game) => (
                        <div
                            key={game.id}
                            className="game-card"
                            onClick={() => navigate(game.route)}
                        >
                            <div className="game-icon">{game.icon}</div>
                            <h3>{game.name}</h3>
                            <p>{game.description}</p>
                            <button className="play-btn">Jouer ! 🚀</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Mascotte */}
            <div className="mascot-container">
                <div className="mascot-ball">
                    <div className="mascot-eye mascot-eye-left"></div>
                    <div className="mascot-eye mascot-eye-right"></div>
                </div>
                <p className="mascot-text">Amuse-toi bien !</p>
            </div>
        </div>
    );
};
