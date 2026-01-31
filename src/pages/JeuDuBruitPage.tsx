import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import './JeuDuBruitPage.css';

interface Platform {
  id: number;
  x: number;
  width: number;
}

type GameState = 'menu' | 'playing' | 'gameOver';

const JeuDuBruitPage: React.FC = () => {
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

  // Constantes CALIBRÉES
  const JUMP_FORCE = -18;
  const MAX_HEIGHT = -250; // Limite de hauteur
  const GRAVITY = 0.9;
  const FLOAT_GRAVITY = 0.05; // Gravité TRÈS faible pour une descente très lente
  const SPEED = 6;
  const VOLUME_THRESHOLD = 15; // Seuil légèrement baissé pour faciliter le maintien du flottement

  useEffect(() => {
    const saved = localStorage.getItem('jeuDuBruitHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
    return () => stopAudio();
  }, []);

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

        // Saut si bruit > seuil ET personnage au sol
        if (avg > VOLUME_THRESHOLD && Math.abs(charYRef.current) < 1) {
          velocityYRef.current = JUMP_FORCE;
          setIsJumping(true);
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
    setScore(0);
    scrollXRef.current = 0;
    charYRef.current = 0;
    setCharY(0);
    velocityYRef.current = 0;

    const initialPlatforms: Platform[] = [
      { id: nextPlatformIdRef.current++, x: 0, width: 1200 },
      { id: nextPlatformIdRef.current++, x: 1500, width: 600 },
      { id: nextPlatformIdRef.current++, x: 2400, width: 800 },
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
        if (charYRef.current >= 0 && velocityYRef.current >= 0) {
          charYRef.current = 0;
          velocityYRef.current = 0;
          onPlatform = true;
          setIsJumping(false);
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
      const newPlat = {
        id: nextPlatformIdRef.current++,
        x: lastPlat.x + lastPlat.width + gap,
        width: width
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

  const endGame = () => {
    setGameState('gameOver');
    stopAudio();
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
        <div className="noise-game-container">
          <div className="game-card-minimal">
            <h2 className="game-title-minimal">Oups !</h2>
            <div className="score-box">
              <span className="score-label">Score</span>
              <span className="score-value">{score}</span>
            </div>
            <button className="btn-primary" onClick={initGame} disabled={!isSessionActive}>Rejouer</button>
            <button className="btn-secondary" onClick={() => setGameState('menu')}>Menu</button>
          </div>
        </div>
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
                  width: `${plat.width}px`
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
