import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import './JeuxPage.css';

const JeuxPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSessionActive, startSession } = useSettings();

    useEffect(() => {
        startSession();
    }, [startSession]);

    if (!isSessionActive) {
        return (
            <div className="jeux-page">
                <div className="session-expired-card">
                    <div className="expired-icon">😴</div>
                    <h1>C'est l'heure de se reposer !</h1>
                    <p>Tu as bien joué. Demande à un adulte pour continuer plus tard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="jeux-page">
            <div className="jeux-header">
                <h1 className="jeux-title">Choisis ton jeu</h1>
            </div>
            <div className="jeux-container">
        <div 
          className="game-card fruit-ninja"
          onClick={() => navigate('/app/jeux/fruit-ninja')}
        >
          <div className="card-image-container">
            <div className="balloon-illustration">
              <div className="balloon-main" />
              <div className="balloon-knot-card" />
              <div className="balloon-string-card" />
            </div>
          </div>
          <div className="card-content">
            <h2>Flash Pop</h2>
            <p>Éclate les ballons, évite les méduses !</p>
          </div>
          <div className="card-arrow">→</div>
        </div>

                <div
                    className="game-card jeu-du-bruit"
                    onClick={() => navigate('/app/jeux/jeu-du-bruit')}
                >
                    <div className="card-image-container">
                        <div className="sound-illustration">
                            <div className="sound-wave" />
                            <div className="sound-wave" />
                            <div className="sound-wave" />
                        </div>
                    </div>
                    <div className="card-content">
                        <h2>Jeu du bruit</h2>
                        <p>Écoute bien et retrouve les sons.</p>
                    </div>
                    <div className="card-arrow">→</div>
                </div>
            </div>
        </div>
    );
};

export default JeuxPage;
