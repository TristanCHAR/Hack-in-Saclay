import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import BottomNav from './BottomNav';
import './AppLayout.css';

const AppLayout: React.FC = () => {
    return (
        <div className="app-layout">
            <TopBar />
            <main className="app-content">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
};

export default AppLayout;
