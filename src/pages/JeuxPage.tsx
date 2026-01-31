import React from 'react';
import { useNavigate } from 'react-router-dom';
import './JeuxPage.css';

const JeuxPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="jeux-page">
      <div className="jeux-container">
        <div 
          className="game-card"
          onClick={() => navigate('/app/jeux/fruit-ninja')}
        >
          <h2>Fruit Ninja</h2>
        </div>
        <div 
          className="game-card"
          onClick={() => navigate('/app/jeux/jeu-du-bruit')}
        >
          <h2>Jeu du bruit</h2>
        </div>
      </div>
    </div>
  );
};

export default JeuxPage;
