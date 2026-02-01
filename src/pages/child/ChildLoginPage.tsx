import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInChild } from '../../lib/childAuth';
import { useChildAuthStore } from '../../stores/childAuthStore';
import { useSettings } from '../../context/SettingsContext';
import './ChildLoginPage.css';

export const ChildLoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setChild } = useChildAuthStore();
    const { startSession, resetSession } = useSettings();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const childResult = await signInChild(username, password);

        if (childResult) {
            // Force reset et start avant de naviguer
            localStorage.removeItem('sessionStartTime');
            sessionStorage.removeItem('sessionStartTime'); // Cleanup old loc too
            resetSession();

            setChild(childResult);

            // On attend un tout petit peu pour que le reset soit pris en compte
            setTimeout(() => {
                startSession();
                navigate('/child/jeux');
            }, 50);
        } else {
            setError('Nom d\'utilisateur ou mot de passe incorrect');
            setLoading(false);
        }
    };

    return (
        <div className="child-login-page">
            <div className="child-login-container">
                {/* Mascotte */}
                <div className="mascot">
                    <div className="mascot-ball">
                        <div className="mascot-eye mascot-eye-left"></div>
                        <div className="mascot-eye mascot-eye-right"></div>
                    </div>
                </div>

                <h1>Bienvenue ! 🎮</h1>
                <p className="subtitle">Connecte-toi pour jouer</p>

                <form onSubmit={handleSubmit} className="child-login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Nom d'utilisateur</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ton pseudo"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Connexion...' : 'Jouer ! 🚀'}
                    </button>
                </form>

                <p className="help-text">
                    Demande à tes parents si tu as oublié ton mot de passe
                </p>

                <button
                    type="button"
                    className="adult-mode-btn"
                    onClick={() => navigate('/auth/parent/login')}
                >
                    👨‍👩‍👧 Mode Adulte
                </button>
            </div>
        </div>
    );
};
