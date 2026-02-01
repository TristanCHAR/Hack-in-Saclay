import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useChildAuthStore } from '../../stores/childAuthStore';
import './OnboardingPage.css';

const OnboardingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const stepParam = searchParams.get('step');
    const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 0);
    const [loading, setLoading] = useState(false);

    const { child, setChild } = useChildAuthStore();

    useEffect(() => {
        if (stepParam) {
            setCurrentStep(parseInt(stepParam));
        }
    }, [stepParam]);

    const handleStart = () => {
        setCurrentStep(1);
    };

    const startFlashPop = () => {
        navigate('/child/jeux/fruit-ninja?mode=evaluation');
    };

    const startNoiseGame = () => {
        navigate('/child/jeux/jeu-du-bruit?mode=evaluation');
    };

    const finishEvaluation = async () => {
        setLoading(true);
        try {
            await api.completeEvaluation();

            // Mettre à jour le store local
            if (child) {
                const updatedChild = { ...child, is_onboarded: true };
                setChild(updatedChild);
            }

            // On ne redirige plus automatiquement, on laisse l'enfant cliquer
            // window.location.href = '/child/jeux';
        } catch (err) {
            console.error("Error completing evaluation:", err);
            // Fallback en cas d'erreur
            // navigate('/child/jeux');
        } finally {
            setLoading(false);
        }
    };

    // Rendu des différentes étapes
    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="onboarding-step intro-step">
                        <div className="mascot-large">👋</div>
                        <h1>Bienvenue !</h1>
                        <p>Avant de commencer, nous allons faire quelques petits jeux pour voir tes super-pouvoirs.</p>
                        <button className="btn-primary-large" onClick={handleStart}>
                            C'est parti ! 🚀
                        </button>
                    </div>
                );
            case 1:
                return (
                    <div className="onboarding-step game-step">
                        <div className="step-indicator">Étape 1/2</div>
                        <h2>Premier défi : Flash Pop</h2>
                        <p>Montre-nous tes réflexes ! Éclate les ballons mais attention aux méduses.</p>
                        <div className="game-preview flash-pop-preview">🎈</div>
                        <button className="btn-primary-large" onClick={startFlashPop}>
                            Jouer maintenant
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="onboarding-step game-step">
                        <div className="step-indicator">Étape 2/2</div>
                        <h2>Deuxième défi : Noise Game</h2>
                        <p>Ouvre grand tes oreilles. Retrouve les sons cachés !</p>
                        <div className="game-preview noise-game-preview">🔊</div>
                        <button className="btn-primary-large" onClick={startNoiseGame}>
                            Jouer maintenant
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="onboarding-step finish-step">
                        <div className="mascot-large">🎉</div>
                        <h1>Bravo !</h1>
                        <p>Tu as terminé ton évaluation. Analyse et envoi du rapport en cours...</p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            {loading ? "Chargement..." : "Rapport envoyé à tes parents ! 📬"}
                        </p>
                        <button
                            className="btn-primary-large"
                            onClick={() => window.location.href = '/child/jeux'}
                            disabled={loading}
                        >
                            {loading ? 'Veuillez patienter...' : 'Découvrir mes jeux'}
                        </button>
                    </div>
                );
            default:
                return <div>Erreur d'étape...</div>;
        }
    };

    // Auto-trigger finishEvaluation when arriving at step 3
    useEffect(() => {
        if (currentStep === 3) {
            finishEvaluation();
        }
    }, [currentStep]);

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                {renderStep()}
            </div>
        </div>
    );
};

export default OnboardingPage;
