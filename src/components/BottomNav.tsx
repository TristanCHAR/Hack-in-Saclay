import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/app/dashboard"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">📊</span>
        <span className="nav-text">Dashboard</span>
      </NavLink>

      <NavLink
        to="/app/children"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">👶</span>
        <span className="nav-text">Enfants</span>
      </NavLink>

      <NavLink
        to="/app/games"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">🎮</span>
        <span className="nav-text">Jeux</span>
      </NavLink>

      <NavLink
        to="/app/analyse"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">📈</span>
        <span className="nav-text">Analyse</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
