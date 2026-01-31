import React from 'react';
import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/app/admin"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-text">Parents</span>
      </NavLink>
      <NavLink
        to="/app/jeux"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-text">Jeux</span>
      </NavLink>
      <NavLink
        to="/app/analyse"
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-text">Analyse</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
