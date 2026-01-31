import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePage.css';

const JeuDuBruitPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="game-page">
      <button className="back-button" onClick={() => navigate('/app/jeux')}>
        ← Retour
      </button>
      <h1>Jeu du bruit</h1>
    </div>
  );
};

export default JeuDuBruitPage;
