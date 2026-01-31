import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const {
    sessionDuration,
    setSessionDuration,
    resetSession,
    medications,
    addMedication,
    seizures,
    addSeizure
  } = useSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [showMedForm, setShowMedName] = useState(false);

  // Seizure Timer State
  const [isSeizureTimerActive, setIsSeizureTimerActive] = useState(false);
  const [seizureTime, setSeizureTime] = useState(0);
  const [manualSeizureDuration, setManualSeizureDuration] = useState('');
  const [showManualSeizureForm, setShowManualSeizureForm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSeizureTimerActive) {
      timerRef.current = setInterval(() => {
        setSeizureTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSeizureTimerActive]);

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
    resetSession();
    setIsSettingsOpen(false);
  };

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (medName.trim()) {
      addMedication(medName.trim());
      setMedName('');
      setShowMedName(false);
    }
  };

  const toggleSeizureTimer = async () => {
    if (isSeizureTimerActive) {
      // Stop and save to API
      await addSeizure(seizureTime);
      setIsSeizureTimerActive(false);
      setSeizureTime(0);
    } else {
      // Start
      setIsSeizureTimerActive(true);
      setShowManualSeizureForm(false);
    }
  };

  const handleManualSeizureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(manualSeizureDuration, 10);
    if (!isNaN(duration) && duration > 0) {
      await addSeizure(duration);
      setManualSeizureDuration('');
      setShowManualSeizureForm(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      <div className="parents-content">
        <div className="admin-card-parents">
          <h1 className="admin-title">Espace Parents</h1>
          <p className="admin-subtitle">Suivi médical et gestion du temps.</p>
        </div>

        <div className="tracking-stack">
          {/* Section Crises - ÉPURÉE */}
          <div className={`tracking-card primary-action-card ${isSeizureTimerActive ? 'timer-active' : ''}`}>
            <div className="seizure-timer-container">
              {isSeizureTimerActive && (
                <div className="timer-display">
                  <span className="timer-value">{formatDuration(seizureTime)}</span>
                  <p className="timer-hint">Chronométrage en cours...</p>
                </div>
              )}

              <button
                onClick={toggleSeizureTimer}
                className={`btn-main-action ${isSeizureTimerActive ? 'btn-stop' : 'btn-danger-large'}`}
              >
                {isSeizureTimerActive ? 'Arrêter et Enregistrer' : 'Démarrer le chrono crise'}
              </button>

              {!isSeizureTimerActive && !showManualSeizureForm && (
                <button
                  className="btn-manual-toggle"
                  onClick={() => setShowManualSeizureForm(true)}
                >
                  ✎ Saisie manuelle
                </button>
              )}

              {showManualSeizureForm && (
                <form onSubmit={handleManualSeizureSubmit} className="manual-entry-form">
                  <div className="manual-input-group">
                    <input
                      type="number"
                      value={manualSeizureDuration}
                      onChange={(e) => setManualSeizureDuration(e.target.value)}
                      placeholder="Durée (sec)"
                      className="manual-log-input"
                      autoFocus
                    />
                    <button type="submit" className="btn-manual-confirm">OK</button>
                    <button
                      type="button"
                      className="btn-manual-cancel"
                      onClick={() => setShowManualSeizureForm(false)}
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="compact-log-list">
              <h3 className="list-title">Dernières crises</h3>
              {seizures.length === 0 ? (
                <p className="empty-log-small">Aucune crise rapportée.</p>
              ) : (
                seizures.slice(0, 2).map(seizure => (
                  <div key={seizure.id} className="compact-log-item seizure-item">
                    <span className="log-name">Crise de {seizure.duration}s</span>
                    <span className="log-time">{formatDate(seizure.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section Médicaments - RESPONSIVE */}
          <div className="tracking-card secondary-action-card">
            <div className="card-header-inline">
              <div className="header-left">
                <span className="card-icon-small">💊</span>
                <h2>Médicaments</h2>
              </div>
              {!showMedForm && (
                <button className="btn-small-add" onClick={() => setShowMedName(true)}>
                  + Ajouter
                </button>
              )}
            </div>

            {showMedForm && (
              <form onSubmit={handleAddMed} className="log-form-inline">
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="Nom..."
                  className="log-input-small"
                  autoFocus
                />
                <div className="form-actions-small">
                  <button type="submit" className="btn-confirm-small">OK</button>
                  <button type="button" className="btn-cancel-small" onClick={() => setShowMedName(false)}>✕</button>
                </div>
              </form>
            )}

            <div className="compact-log-list">
              {medications.length === 0 ? (
                <p className="empty-log-small">Aucune prise enregistrée.</p>
              ) : (
                medications.slice(0, 2).map(med => (
                  <div key={med.id} className="compact-log-item">
                    <span className="log-name">{med.name}</span>
                    <span className="log-time">{formatDate(med.created_at)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="settings-panel-overlay-full">
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
