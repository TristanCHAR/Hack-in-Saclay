import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import './FruitNinjaPage.css';

interface Bubble {
  id: number;
  x: number;
  y: number;
  color: string;
  type: 'fruit' | 'jellyfish';
  createdAt: number;
  isPopping?: boolean;
}

type GameState = 'menu' | 'playing' | 'gameOver';

const FruitNinjaPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionDuration, isSessionActive, sessionStartTime } = useSettings();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [errorEffect, setErrorEffect] = useState(false);
  const [gameTime, setGameTime] = useState(20);
  const [highScore, setHighScore] = useState(0);

  // Statistiques pour l'API
  const reactionTimesRef = useRef<number[]>([]);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const jellyfishHitsRef = useRef(0);
  const jellyfishTotalRef = useRef(0);

  const nextIdRef = useRef(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const popSoundRef = useRef<HTMLAudioElement | null>(null);
  const errorSoundRef = useRef<HTMLAudioElement | null>(null);
  const finishedRef = useRef(false);

  const fruitColors = ['#A0C4FF', '#B8E0D2', '#FFD6A5', '#FFC8DD', '#D9B3FF'];
  const jellyfishColor = '#D4B5E8';

  useEffect(() => {
    const saved = localStorage.getItem('fruitNinjaHighScore');
    if (saved) setHighScore(parseInt(saved, 10));

    popSoundRef.current = new Audio(process.env.PUBLIC_URL + '/assets/sounds/pop_ballon.wav');
    errorSoundRef.current = new Audio(process.env.PUBLIC_URL + '/assets/sounds/medusa.mp3');

    popSoundRef.current.load();
    errorSoundRef.current.load();
  }, []);

  // Vérifier si la session expire pendant le jeu
  useEffect(() => {
    if (gameState === 'playing' && !isSessionActive) {
      finishGame();
    }
  }, [gameState, isSessionActive]);

  useEffect(() => {
    if (gameState !== 'playing' || finishedRef.current) return;

    const timer = setInterval(() => {
      if (finishedRef.current) return;

      const sessionElapsed = (Date.now() - (sessionStartTime || Date.now())) / 1000;
      const sessionRemaining = Math.max(0, Math.ceil(sessionDuration - sessionElapsed));

      setGameTime((prev) => {
        const nextTime = prev - 1;
        if (nextTime <= 0 || sessionRemaining <= 0) {
          // Marquer comme terminé et changer l'état directement
          if (!finishedRef.current) {
            finishedRef.current = true;
            // Appeler finishGame en dehors du setState callback
            setTimeout(() => finishGame(), 0);
          }
          return 0;
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, sessionDuration, sessionStartTime]);

  useEffect(() => {
    if (gameState !== 'playing' || finishedRef.current) return;
    const spawnInterval = setInterval(() => {
      const isJellyfish = Math.random() < 0.25;
      if (isJellyfish) jellyfishTotalRef.current++;
      const newBubble: Bubble = {
        id: nextIdRef.current++,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 50,
        color: isJellyfish ? jellyfishColor : fruitColors[Math.floor(Math.random() * fruitColors.length)],
        type: isJellyfish ? 'jellyfish' : 'fruit',
        createdAt: Date.now(),
        isPopping: false,
      };
      setBubbles((prev) => [...prev, newBubble]);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || finishedRef.current) return;
    const cleanupInterval = setInterval(() => {
      if (finishedRef.current) return;
      const now = Date.now();
      setBubbles((prev) => {
        const filtered = prev.filter(b => {
          const isExpired = now - b.createdAt >= 4000;
          if (isExpired && b.type === 'fruit' && !b.isPopping) {
            missesRef.current++; // On compte un raté si le ballon disparaît
          }
          return !isExpired || b.isPopping;
        });
        return filtered;
      });
    }, 100);
    return () => clearInterval(cleanupInterval);
  }, [gameState]);

  const playPopSound = () => {
    if (popSoundRef.current) {
      popSoundRef.current.currentTime = 0;
      popSoundRef.current.play().catch(e => console.log("Audio play blocked"));
    }
  };

  const playErrorSound = () => {
    if (errorSoundRef.current) {
      errorSoundRef.current.currentTime = 0;
      errorSoundRef.current.play().catch(e => console.log("Audio play blocked"));
    }
  };

  const handleBubbleClick = (bubble: Bubble, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (bubble.isPopping) return;

    const reactionTime = Date.now() - bubble.createdAt;

    if (bubble.type === 'jellyfish') {
      jellyfishHitsRef.current++;
      playErrorSound();
      setScore((prev) => Math.max(0, prev - 10));
      setErrorEffect(true);
      setBubbles((prev) => prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b));
      setTimeout(() => {
        setErrorEffect(false);
        setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 600);
    } else {
      hitsRef.current++;
      reactionTimesRef.current.push(reactionTime);
      playPopSound();
      setScore((prev) => prev + 5);
      setBubbles((prev) => prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b));
      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 400);
    }
  };

  const startGame = () => {
    if (!isSessionActive) return;
    // Reset stats
    finishedRef.current = false;
    reactionTimesRef.current = [];
    hitsRef.current = 0;
    missesRef.current = 0;
    jellyfishHitsRef.current = 0;
    jellyfishTotalRef.current = 0;
    
    setGameState('playing');
    setScore(0);
    setBubbles([]);
    setGameTime(sessionDuration); // Utilise la durée de session configurée
    setErrorEffect(false);
    nextIdRef.current = 0;
  };

  const finishGame = async () => {
    // finishedRef.current est déjà géré par l'appelant
    finishedRef.current = true;
    setGameState('gameOver');

    // Calcul des KPIs pour l'API
    const mrt = reactionTimesRef.current.length > 0
      ? reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
      : 0;

    const totalFruitTargets = hitsRef.current + missesRef.current;
    
    // Inhibition = capacité à ne PAS cliquer sur les méduses
    // 1.0 = parfait (aucune méduse cliquée), 0.0 = toutes les méduses cliquées
    const inhibition_rate = jellyfishTotalRef.current > 0
      ? 1 - (jellyfishHitsRef.current / jellyfishTotalRef.current)
      : 1;
    
    // IIV (Intra-Individual Variability) : écart-type des temps de réaction
    let iiv_score = 0;
    if (reactionTimesRef.current.length > 1) {
      const mean = mrt;
      const squareDiffs = reactionTimesRef.current.map(t => Math.pow(t - mean, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
      iiv_score = Math.sqrt(avgSquareDiff);
    }

    try {
      await api.createFlashPopResult(mrt, inhibition_rate, iiv_score);
      console.log("Score FlashPop envoyé à l'API");
    } catch (err) {
      console.error("Erreur envoi score FlashPop:", err);
    }

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('fruitNinjaHighScore', score.toString());
    }
  };

  // Redirection automatique après 3 secondes quand gameOver et session expirée
  useEffect(() => {
    if (gameState === 'gameOver' && !isSessionActive) {
      const timer = setTimeout(() => {
        navigate('/app/jeux');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, isSessionActive, navigate]);

  if (gameState === 'menu') {
    return (
      <div className="game-container">
        <div className="game-card-minimal">
          <h1 className="game-title-minimal">Flash Pop</h1>
          <p className="game-subtitle-minimal">Cliquez sur les ballons colorés. Évitez les méduses.</p>
          {highScore > 0 && <p className="high-score-minimal">Record : {highScore}</p>}
          <button className="btn-primary" onClick={startGame} disabled={!isSessionActive}>
            {isSessionActive ? 'Commencer' : 'Session expirée'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="game-container">
        <div className="game-card-minimal">
          <h2 className="game-title-minimal">🎉 Bravo !</h2>
          <p className="game-subtitle-minimal">Vous avez fait :</p>
          <div className="score-box" style={{ margin: '20px 0' }}>
            <span className="score-value" style={{ fontSize: '3rem', color: '#4facfe' }}>{score}</span>
            <span className="score-label" style={{ fontSize: '1.5rem' }}>points</span>
          </div>
          <p className="game-subtitle-minimal" style={{ marginTop: '20px', opacity: 0.7 }}>À la prochaine ! 👋</p>
          {!isSessionActive && (
            <p style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '10px' }}>Redirection automatique...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`game-screen ${errorEffect ? 'show-error' : ''}`}>
      <div className="game-header-minimal">
        <div className="stat-item score-stat">
          <span className="stat-label">Score</span>
          <span className="stat-value">{score}</span>
        </div>
        <div className="stat-item timer-stat">
          <span className="stat-label">Temps</span>
          <span className="stat-value">{gameTime}s</span>
        </div>
        <button className="btn-quit-top" onClick={finishGame}>Quitter</button>
      </div>

      <div className="game-play-area" ref={gameAreaRef}>
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className={`game-bubble ${bubble.type} ${bubble.isPopping ? 'popping' : ''}`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              backgroundColor: bubble.type === 'fruit' ? bubble.color : 'transparent',
            }}
            onMouseDown={(e) => handleBubbleClick(bubble, e)}
            onTouchStart={(e) => handleBubbleClick(bubble, e)}
          >
            {bubble.type === 'jellyfish' && (
              <div className="jellyfish-asset">
                <div className="jellyfish-head" />
                <div className="jellyfish-tentacles">
                  <div className="tentacle" />
                  <div className="tentacle" />
                  <div className="tentacle" />
                </div>
              </div>
            )}
            {bubble.type === 'fruit' && <div className="balloon-knot" style={{ backgroundColor: bubble.color }} />}
            {bubble.type === 'fruit' && <div className="balloon-string" />}
            {bubble.isPopping && (
              <div className="pop-particles">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="particle" style={{ '--angle': `${i * 60}deg` } as any} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default FruitNinjaPage;
