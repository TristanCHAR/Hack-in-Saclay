import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ChildLoginPage } from './pages/child/ChildLoginPage';
import { ChildGamesPage } from './pages/child/ChildGamesPage';
import { WorkspaceSelectPage } from './pages/workspace/WorkspaceSelectPage';
import { ChildrenManagement } from './pages/parent/ChildrenManagement';
import { GameAccessManagement } from './pages/parent/GameAccessManagement';
import AppLayout from './components/AppLayout';
import AdminPage from './pages/AdminPage';
import JeuxPage from './pages/JeuxPage';
import AnalysisPage from './pages/AnalysisPage';
import FruitNinjaPage from './pages/FruitNinjaPage';
import JeuDuBruitPage from './pages/JeuDuBruitPage';
import { useAuthStore } from './stores/authStore';
import { useChildAuthStore } from './stores/childAuthStore';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { user, loading } = useAuthStore();

    if (loading) {
        return <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #E8D5E0 0%, #D4E5F7 100%)',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '18px',
            color: '#666'
        }}>Chargement...</div>;
    }

    if (!user) {
        return <Navigate to="/auth/parent/login" replace />;
    }

    return children;
};

const RequireChildAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { child, loading } = useChildAuthStore();

    if (loading) {
        return <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #E8D5E0 0%, #D4E5F7 100%)',
            fontFamily: 'Nunito, sans-serif',
            fontSize: '18px',
            color: '#666'
        }}>Chargement...</div>;
    }

    if (!child) {
        return <Navigate to="/auth/child/login" replace />;
    }

    return children;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Parent/Neuro auth routes */}
                    <Route path="/auth/parent/login" element={<LoginPage />} />
                    <Route path="/auth/parent/register" element={<RegisterPage />} />

                    {/* Child auth routes */}
                    <Route path="/auth/child/login" element={<ChildLoginPage />} />

                    {/* Parent protected routes */}
                    <Route path="/workspaces" element={
                        <RequireAuth>
                            <WorkspaceSelectPage />
                        </RequireAuth>
                    } />

                    <Route path="/app" element={
                        <RequireAuth>
                            <AppLayout />
                        </RequireAuth>
                    }>
                        <Route index element={<Navigate to="/app/dashboard" replace />} />
                        <Route path="dashboard" element={<AdminPage />} />
                        <Route path="children" element={<ChildrenManagement />} />
                        <Route path="games" element={<GameAccessManagement />} />
                        <Route path="admin" element={<AdminPage />} />
                        <Route path="jeux" element={<JeuxPage />} />
                        <Route path="analyse" element={<AnalysisPage />} />
                        <Route path="jeux/fruit-ninja" element={<FruitNinjaPage />} />
                        <Route path="jeux/jeu-du-bruit" element={<JeuDuBruitPage />} />
                    </Route>

                    {/* Child protected routes */}
                    <Route path="/child/jeux" element={
                        <RequireChildAuth>
                            <ChildGamesPage />
                        </RequireChildAuth>
                    } />
                    <Route path="/child/jeux/fruit-ninja" element={
                        <RequireChildAuth>
                            <FruitNinjaPage />
                        </RequireChildAuth>
                    } />
                    <Route path="/child/jeux/jeu-du-bruit" element={
                        <RequireChildAuth>
                            <JeuDuBruitPage />
                        </RequireChildAuth>
                    } />

                    {/* Default redirects */}
                    <Route path="/auth/login" element={<Navigate to="/auth/child/login" replace />} />
                    <Route path="/auth/register" element={<Navigate to="/auth/parent/register" replace />} />
                    <Route path="/" element={<Navigate to="/auth/child/login" replace />} />

                    {/* Catch-all for undefined routes */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
