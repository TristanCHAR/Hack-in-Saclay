import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/workspaces');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="mascot">
                    <div className="mascot-ball">
                        <div className="mascot-face">
                            <div className="eye left"></div>
                            <div className="eye right"></div>
                            <div className="smile"></div>
                        </div>
                    </div>
                </div>

                <h1>Bienvenue sur KidoKinetics!</h1>
                <p className="subtitle">Connecte-toi pour commencer l'aventure</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="ton@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>

                    <div className="login-footer">
                        <p className="auth-footer">
                            Pas encore de compte ?{' '}
                            <button onClick={() => navigate('/auth/parent/register')} className="link-button">
                                Créer un compte
                            </button>
                        </p>

                        <button
                            type="button"
                            className="child-mode-btn"
                            onClick={() => navigate('/auth/child/login')}
                        >
                            🎮 Mode Enfant
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
