import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import './AppLayout.css';

const AppLayout: React.FC = () => {
    return (
        <div className="app-layout">
            <main className="app-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default AppLayout;
