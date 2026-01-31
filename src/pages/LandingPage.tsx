import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('PWA installée');
            }

            setDeferredPrompt(null);
            setIsInstallable(false);
        }

        // Navigate to app regardless
        navigate('/app');
    };

    return (
        <div className="landing-container">
            <div className="landing-content">
                <h1 className="landing-title">Jeux Cognitifs</h1>
                <p className="landing-description">
                    Bienvenue dans l'application de collecte de données cognitives et motrices
                    pour la recherche sur les épilepsies développementales rares pédiatriques.
                </p>
                <p className="landing-info">
                    Cette application propose des mini-jeux interactifs conçus pour mesurer
                    l'efficacité des traitements de manière non invasive et ludique.
                </p>
                <button
                    className="landing-button"
                    onClick={handleInstallClick}
                >
                    {isInstallable ? 'Installer l\'application' : 'Accéder à l\'application'}
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
