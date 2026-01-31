import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import './AdminPage.css';

const AdminPage: React.FC = () => {
    const { sessionDuration, setSessionDuration, resetSession } = useSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setSessionDuration(value);
        } else if (e.target.value === '') {
            setSessionDuration(0);
        }
    };

    const handleSave = () => {
        if (sessionDuration < 60) setSessionDuration(60);
        resetSession(); // On réinitialise la session quand on change les réglages
        setIsSettingsOpen(false);
    };

    return (
        <div className="admin-container">
            <div className="admin-header-actions">
                <button
                    className={`settings-icon-btn ${isSettingsOpen ? 'active' : ''}`}
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    aria-label="Paramètres"
                >
                    ⚙️
                </button>
            </div>

            {isSettingsOpen && (
                <div className="settings-panel-overlay">
                    <div className="settings-content-card">
                        <h3>Configuration</h3>
                        <div className="setting-item">
                            <label htmlFor="duration">Durée de la session (secondes)</label>
                            <div className="input-wrapper">
                                <input
                                    id="duration"
                                    type="number"
                                    value={sessionDuration || ''}
                                    onChange={handleDurationChange}
                                    placeholder="Min: 60"
                                    min="60"
                                />
                                <span className="unit">sec</span>
                            </div>
                            {sessionDuration < 60 && sessionDuration !== 0 && (
                                <p className="error-text">La durée minimum est de 60 secondes.</p>
                            )}
                        </div>
                        <p className="settings-info-text">
                            Enregistrer réinitialisera le temps de jeu pour l'enfant.
                        </p>
                        <button
                            className="btn-close-settings"
                            onClick={handleSave}
                        >
                            Enregistrer & Relancer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
