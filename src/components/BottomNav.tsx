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
                <span className="nav-text">Admin</span>
            </NavLink>
            <NavLink
                to="/app/jeux"
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            >
                <span className="nav-text">Jeux</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
