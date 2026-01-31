import React, { useState, useEffect, useRef } from 'react';
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
    const [gameState, setGameState] = useState<GameState>('menu');
    const [score, setScore] = useState(0);
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [errorEffect, setErrorEffect] = useState(false);
    const [gameTime, setGameTime] = useState(60);
    const [highScore, setHighScore] = useState(0);

    const nextIdRef = useRef(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    // Audio refs
    const popSoundRef = useRef<HTMLAudioElement | null>(null);
    const errorSoundRef = useRef<HTMLAudioElement | null>(null);

    const fruitColors = ['#A0C4FF', '#B8E0D2', '#FFD6A5', '#FFC8DD', '#D9B3FF'];
    const jellyfishColor = '#D4B5E8';

    useEffect(() => {
        const saved = localStorage.getItem('fruitNinjaHighScore');
        if (saved) setHighScore(parseInt(saved, 10));

        // Initialisation des sons locaux
        popSoundRef.current = new Audio(process.env.PUBLIC_URL + '/assets/sounds/pop_ballon.wav');
        errorSoundRef.current = new Audio(process.env.PUBLIC_URL + '/assets/sounds/medusa.mp3');

        // Préchargement
        popSoundRef.current.load();
        errorSoundRef.current.load();
    }, []);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const timer = setInterval(() => {
            setGameTime((prev) => {
                if (prev <= 1) {
                    setGameState('gameOver');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const spawnInterval = setInterval(() => {
            const isJellyfish = Math.random() < 0.25;
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
        }, 1000);
        return () => clearInterval(spawnInterval);
    }, [gameState]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setBubbles((prev) => prev.filter(b => (now - b.createdAt < 2500) || b.isPopping));
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

        if (bubble.type === 'jellyfish') {
            playErrorSound();
            setScore((prev) => Math.max(0, prev - 10));
            setErrorEffect(true);
            // Animation de "choc" pour la méduse
            setBubbles((prev) => prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b));
            setTimeout(() => {
                setErrorEffect(false);
                setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
            }, 600);
        } else {
            playPopSound();
            setScore((prev) => prev + 5);
            setBubbles((prev) => prev.map(b => b.id === bubble.id ? { ...b, isPopping: true } : b));
            setTimeout(() => {
                setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
            }, 400);
        }
    };

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setBubbles([]);
        setGameTime(60);
        setErrorEffect(false);
        nextIdRef.current = 0;
    };

    const finishGame = () => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('fruitNinjaHighScore', score.toString());
        }
        setGameState('menu');
    };

    if (gameState === 'menu') {
        return (
            <div className="game-container">
                <div className="game-card-minimal">
                    <h1 className="game-title-minimal">Fruit Ninja</h1>
                    <p className="game-subtitle-minimal">Cliquez sur les ballons colorés. Évitez les méduses.</p>
                    {highScore > 0 && <p className="high-score-minimal">Record : {highScore}</p>}
                    <button className="btn-primary" onClick={startGame}>Commencer</button>
                </div>
            </div>
        );
    }

    if (gameState === 'gameOver') {
        return (
            <div className="game-container">
                <div className="game-card-minimal">
                    <h2 className="game-title-minimal">Partie terminée</h2>
                    <div className="score-box">
                        <span className="score-label">Score</span>
                        <span className="score-value">{score}</span>
                    </div>
                    <button className="btn-primary" onClick={startGame}>Rejouer</button>
                    <button className="btn-secondary" onClick={finishGame}>Retour</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`game-screen ${errorEffect ? 'show-error' : ''}`}>
            <div className="game-header-minimal">
                <div className="stat-item">
                    <span className="stat-label">Temps</span>
                    <span className="stat-value">{gameTime}s</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Score</span>
                    <span className="stat-value">{score}</span>
                </div>
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

            <button className="btn-quit" onClick={finishGame}>Quitter</button>
        </div>
    );
};

export default FruitNinjaPage;
