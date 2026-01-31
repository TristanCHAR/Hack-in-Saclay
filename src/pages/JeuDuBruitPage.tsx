import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import './JeuDuBruitPage.css';

interface Platform {
  id: number;
  x: number;
  width: number;
  y: number; // Ajout de la hauteur variable
}

type GameState = 'menu' | 'playing' | 'gameOver';

// Composant pour l'écran de fin
const GameOverScreenWrapper: React.FC<{ score: number; navigate: any }> = ({ score, navigate }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/app/jeux');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="noise-game-container">
      <div className="game-card-minimal">
        <h2 className="game-title-minimal">🎉 Bravo !</h2>
        <p className="game-subtitle-minimal">Vous avez fait :</p>
        <div className="score-box" style={{ margin: '20px 0' }}>
          <span className="score-value" style={{ fontSize: '3rem', color: '#4facfe' }}>{score}</span>
          <span className="score-label" style={{ fontSize: '1.5rem' }}>points</span>
        </div>
        <p className="game-subtitle-minimal" style={{ marginTop: '20px', opacity: 0.7 }}>À la prochaine ! 👋</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '10px' }}>Redirection automatique...</p>
      </div>
    </div>
  );
};

const JeuDuBruitPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSessionActive, sessionDuration, sessionStartTime } = useSettings();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [volume, setVolume] = useState(0);

  const requestRef = useRef<number>();
  const audioRequestRef = useRef<number>();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Physique
  const [charY, setCharY] = useState(0);
  const charYRef = useRef(0);
  const velocityYRef = useRef(0);
  const [isJumping, setIsJumping] = useState(false);

  // Monde
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const scrollXRef = useRef(0);
  const nextPlatformIdRef = useRef(0);

  // Métriques pour l'API
  const gameEndedRef = useRef(false);
  const jumpCountRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const totalAirTimeRef = useRef(0);
  const airTimeStartRef = useRef<number | null>(null);

  // Constantes CALIBRÉES
  const JUMP_FORCE = -18;
  const MAX_HEIGHT = -250; // Limite de hauteur
  const GRAVITY = 0.9;
  const FLOAT_GRAVITY = 0.03; // Gravité TRÈS faible pour une descente très lente
  const SPEED = 6;
  const VOLUME_THRESHOLD = 10; // Seuil légèrement baissé pour faciliter le maintien du flottement

  useEffect(() => {
    const saved = localStorage.getItem('jeuDuBruitHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => stopAudio();
  }, []);

  // Vérifier si la session expire pendant le jeu
  useEffect(() => {
    if (gameState === 'playing' && !isSessionActive) {
      endGame();
    }
  }, [gameState, isSessionActive]);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      streamRef.current = stream;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        setVolume(avg);

        // Saut si bruit > seuil ET personnage au sol (avec une marge de tolérance)
        if (avg > VOLUME_THRESHOLD && !isJumping) {
          velocityYRef.current = JUMP_FORCE;
          setIsJumping(true);
          jumpCountRef.current++;
          airTimeStartRef.current = Date.now();
        }

        audioRequestRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.error("Erreur micro:", err);
    }
  };

  const stopAudio = () => {
    if (audioRequestRef.current) cancelAnimationFrame(audioRequestRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.log("Erreur lors de la fermeture de l'AudioContext:", err));
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const initGame = async () => {
    gameEndedRef.current = false;
    jumpCountRef.current = 0;
    gameStartTimeRef.current = Date.now();
    totalAirTimeRef.current = 0;
    airTimeStartRef.current = null;
    setScore(0);
    scrollXRef.current = 0;
    charYRef.current = 0;
    setCharY(0);
    velocityYRef.current = 0;

    const initialPlatforms: Platform[] = [
      { id: nextPlatformIdRef.current++, x: 0, width: 1200, y: 0 },
      { id: nextPlatformIdRef.current++, x: 1500, width: 600, y: -50 },
      { id: nextPlatformIdRef.current++, x: 2400, width: 800, y: 50 },
    ];
    setPlatforms(initialPlatforms);
    platformsRef.current = initialPlatforms;

    setGameState('playing');
    await startAudio();
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // 1. Déplacement
    scrollXRef.current += SPEED;
    setScore(Math.floor(scrollXRef.current / 10));

    // 2. Physique avec effet de FLOTTEMENT et LIMITE DE HAUTEUR
    const isNoisy = volume > VOLUME_THRESHOLD;
    const currentGravity = (isNoisy && charYRef.current < 0)
      ? FLOAT_GRAVITY
      : GRAVITY;

    velocityYRef.current += currentGravity;
    charYRef.current += velocityYRef.current;

    // Limite de hauteur (plafond invisible)
    if (charYRef.current < MAX_HEIGHT) {
      charYRef.current = MAX_HEIGHT;
      velocityYRef.current = 0;
    }

    // 3. Collisions
    const charX = 100;
    const absoluteCharX = scrollXRef.current + charX;
    let onPlatform = false;

    for (const plat of platformsRef.current) {
      if (absoluteCharX >= plat.x && absoluteCharX <= plat.x + plat.width) {
        // Collision avec tolérance sur la hauteur de la plateforme
        // On vérifie si le personnage est en train de descendre et s'il est proche du haut de la plateforme
        if (velocityYRef.current >= 0 && charYRef.current >= plat.y - 10 && charYRef.current <= plat.y + 10) {
          charYRef.current = plat.y;
          velocityYRef.current = 0;
          onPlatform = true;
          setIsJumping(false);
          if (airTimeStartRef.current !== null) {
            totalAirTimeRef.current += Date.now() - airTimeStartRef.current;
            airTimeStartRef.current = null;
          }
          break;
        }
      }
    }

    // 4. Chute (GameOver)
    if (!onPlatform && charYRef.current > 100) {
      endGame();
      return;
    }

    // 5. Génération
    const lastPlat = platformsRef.current[platformsRef.current.length - 1];
    if (lastPlat.x < absoluteCharX + 1500) {
      const gap = 250 + Math.random() * 250;
      const width = 500 + Math.random() * 600;
      // Nouvelle hauteur aléatoire entre -80 et 80
      const lastY = lastPlat.y;
      const newY = Math.max(-150, Math.min(150, lastY + (Math.random() * 160 - 80)));

      const newPlat = {
        id: nextPlatformIdRef.current++,
        x: lastPlat.x + lastPlat.width + gap,
        width: width,
        y: newY
      };
      platformsRef.current = [...platformsRef.current, newPlat];
      if (platformsRef.current.length > 10) platformsRef.current.shift();
      setPlatforms([...platformsRef.current]);
    }

    setCharY(charYRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, volume]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, gameLoop]);

  const endGame = async () => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    setGameState('gameOver');
    stopAudio();

    // Calcul des métriques
    const gameDuration = Date.now() - gameStartTimeRef.current;
    const jumps = jumpCountRef.current;
    const vocal_initention_latence = jumps > 0 ? Math.round(gameDuration / jumps) : 0;
    const motrice_planification = jumps > 0 ? Math.round(totalAirTimeRef.current / jumps) : 0;

    try {
      await api.createNoiseGameResult(vocal_initention_latence, motrice_planification);
      console.log('Score NoiseGame envoyé à l\'API');
    } catch (err) {
      console.error('Erreur envoi score NoiseGame:', err);
    }

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('jeuDuBruitHighScore', score.toString());
    }
  };

  return (
    <div className="noise-game-screen">
      <div className="game-header-minimal">
        <div className="stat-item score-stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat-item volume-stat">
          <div className="volume-bar-bg">
            <div className="volume-bar-fill" style={{ height: `${Math.min(100, (volume / 100) * 100)}%` }} />
          </div>
          <span className="stat-label">Micro</span>
        </div>
        <button className="btn-quit-top" onClick={endGame}>Quitter</button>
      </div>

      {gameState === 'menu' ? (
        <div className="noise-game-container">
          <div className="game-card-minimal">
            <h1 className="game-title-minimal">NoiseGame</h1>
            <p className="game-subtitle-minimal">Crie ou fais du bruit pour faire sauter ton personnage !</p>
            {highScore > 0 && <p className="high-score-minimal">Record : {highScore}</p>}
            <button className="btn-primary" onClick={initGame} disabled={!isSessionActive}>
              {isSessionActive ? 'Commencer' : 'Session expirée'}
            </button>
          </div>
        </div>
      ) : gameState === 'gameOver' ? (
        <GameOverScreenWrapper score={score} navigate={navigate} />
      ) : (
        <div className="game-play-zone">
          <div className="game-world">
            <div
              className={`character ${isJumping ? 'jumping' : ''} ${volume > VOLUME_THRESHOLD && charY < 0 ? 'floating' : ''}`}
              style={{ transform: `translateY(${charY}px)` }}
            >
              <div className="char-body">
                <div className="char-eyes" />
              </div>
            </div>

            {platforms.map(plat => (
              <div
                key={plat.id}
                className="platform"
                style={{
                  left: `${plat.x - scrollXRef.current}px`,
                  width: `${plat.width}px`,
                  top: `${plat.y}px`
                }}
              />
            ))}
          </div>
          <div className="noise-hint">Fais du bruit pour sauter et flotter !</div>
        </div>
      )}
    </div>
  );
};

export default JeuDuBruitPage;
